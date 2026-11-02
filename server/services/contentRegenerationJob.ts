import { generateBusinessContent } from './aiContentGenerator';

interface Job {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalBusinesses: number;
  processedBusinesses: number;
  successfulGenerations: number;
  failedGenerations: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  currentBusinessName?: string;
}

/**
 * In-memory job queue manager for bulk content regeneration
 * Processes businesses sequentially to avoid overwhelming OpenAI API
 */
class ContentRegenerationJobManager {
  private jobs: Map<string, Job> = new Map();
  private activeJobId: string | null = null;

  /**
   * Creates a new bulk regeneration job
   */
  async createJob(businessIds?: number[]): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import('../storage');
    
    // Get businesses to process
    let businesses;
    if (businessIds && businessIds.length > 0) {
      businesses = await Promise.all(
        businessIds.map(id => storage.getBusinessById(id))
      );
      businesses = businesses.filter(b => b !== undefined);
    } else {
      // Get all businesses (we'll filter for active ones after)
      const result = await storage.getBusinesses({ limit: 10000 });
      businesses = result.businesses.filter(b => b.isActive);
    }

    const job: Job = {
      id: jobId,
      status: 'pending',
      totalBusinesses: businesses.length,
      processedBusinesses: 0,
      successfulGenerations: 0,
      failedGenerations: 0
    };

    this.jobs.set(jobId, job);

    // Start processing asynchronously
    this.processJob(jobId, businesses).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
      }
    });

    return jobId;
  }

  /**
   * Gets job status and progress
   */
  getJobStatus(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Gets all jobs (for admin monitoring)
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  /**
   * Deletes a completed or failed job
   */
  deleteJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    // Don't allow deleting running jobs
    if (job.status === 'running') {
      throw new Error('Cannot delete a running job');
    }

    return this.jobs.delete(jobId);
  }

  /**
   * Processes a regeneration job
   */
  private async processJob(jobId: string, businesses: any[]): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Wait if another job is running (sequential processing)
    while (this.activeJobId !== null && this.activeJobId !== jobId) {
      await this.sleep(1000);
    }

    this.activeJobId = jobId;
    job.status = 'running';
    job.startedAt = new Date();

    console.log(`🚀 Starting content regeneration job ${jobId} for ${businesses.length} businesses`);

    const { storage } = await import('../storage');

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      job.currentBusinessName = business.name;

      try {
        console.log(`[${i + 1}/${businesses.length}] Regenerating content for: ${business.name}`);

        // Get category and location info
        const [category, province, locality] = await Promise.all([
          storage.getCategoryById(business.categoryId),
          storage.getProvinceById(business.provinceId),
          storage.getLocalityById(business.localityId)
        ]);

        // Generate AI content
        const aiContent = await generateBusinessContent({
          name: business.name,
          category: category?.name || 'Business',
          province: province?.name || 'Pakistan',
          locality: locality?.name || '',
          phone: business.phone,
          email: business.email,
          website: business.website,
          services: business.services || [],
          specialties: business.specialties || [],
          description: business.description
        });

        // Update business with AI-generated content (including fallback)
        if (aiContent.status === 'success' || aiContent.status === 'partial' || aiContent.status === 'fallback') {
          await storage.updateBusiness(business.id, {
            description: aiContent.description,
            metaDescription: aiContent.metaDescription,
            tagline: aiContent.tagline,
            socialPreview: aiContent.socialPreview,
            contentGenerationStatus: aiContent.status,
            contentGeneratedAt: new Date()
          });

          if (aiContent.status === 'fallback') {
            job.failedGenerations++;
            console.log(`⚠️ [${i + 1}/${businesses.length}] Used fallback content for: ${business.name}`);
          } else {
            job.successfulGenerations++;
            console.log(`✅ [${i + 1}/${businesses.length}] Content regenerated for: ${business.name}`);
          }
        } else {
          job.failedGenerations++;
          console.log(`❌ [${i + 1}/${businesses.length}] Failed to generate content for: ${business.name}`);
        }

      } catch (error: any) {
        job.failedGenerations++;
        console.error(`❌ [${i + 1}/${businesses.length}] Error processing ${business.name}:`, error.message);
      } finally {
        job.processedBusinesses = i + 1;
      }

      // Small delay to avoid overwhelming the API
      if (i < businesses.length - 1) {
        await this.sleep(500);
      }
    }

    job.status = 'completed';
    job.completedAt = new Date();
    job.currentBusinessName = undefined;
    this.activeJobId = null;

    console.log(`✅ Content regeneration job ${jobId} completed:`);
    console.log(`   - Total: ${job.totalBusinesses}`);
    console.log(`   - Successful: ${job.successfulGenerations}`);
    console.log(`   - Failed: ${job.failedGenerations}`);
  }

  /**
   * Utility: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleans up old completed jobs (keep last 10)
   */
  cleanupOldJobs(): void {
    const jobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' || job.status === 'failed')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

    if (jobs.length > 10) {
      const toDelete = jobs.slice(10);
      toDelete.forEach(job => this.jobs.delete(job.id));
      console.log(`🧹 Cleaned up ${toDelete.length} old jobs`);
    }
  }
}

// Singleton instance
let jobManagerInstance: ContentRegenerationJobManager | null = null;

/**
 * Gets or creates the job manager instance
 */
export function getJobManager(): ContentRegenerationJobManager {
  if (!jobManagerInstance) {
    jobManagerInstance = new ContentRegenerationJobManager();
  }
  return jobManagerInstance;
}
