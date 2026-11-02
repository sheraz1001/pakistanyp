-- Keep updated_at current whenever public content changes, whatever code path saved it
-- (admin panel, owner dashboard, imports). Counters such as view_count are ignored, so
-- page views don't look like edits. Used by the sitemap lastmod dates and IndexNow.
CREATE OR REPLACE FUNCTION pakistanyp_touch_updated_at() RETURNS trigger AS $$
DECLARE
  ignore text[] := ARRAY['updated_at','view_count','views','click_count','business_count','review_count',
                         'rating_average','rating_count','last_viewed_at','search_count','impressions'];
BEGIN
  IF (to_jsonb(NEW) - ignore) IS DISTINCT FROM (to_jsonb(OLD) - ignore)
     AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['businesses','categories','localities','provinces','news_articles','blog_posts'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL AND EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS pakistanyp_touch_updated_at ON %I', t);
      EXECUTE format('CREATE TRIGGER pakistanyp_touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION pakistanyp_touch_updated_at()', t);
    END IF;
  END LOOP;
END $$;
