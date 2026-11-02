import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { country } from "@shared/country";
import { usePlaces, buildCityTree, shortPlaceName } from "@/lib/places";

/**
 * Province > City > Locality picker for business forms (all three are required).
 *
 * Writes the form fields "provinceId", "cityId" and "localityId" (strings).
 * - Islamabad Capital Territory has one city: the city step is skipped and set automatically.
 * - A city with no listed localities: the business is filed under the city itself
 *   (localityId = the city's id), so a locality is always set.
 */
export function LocationPicker({
  form,
  provinces,
  onProvinceChange,
  idPrefix = "loc",
}: {
  form: UseFormReturn<any>;
  provinces: Array<{ id: number; name: string }>;
  onProvinceChange?: (provinceId: string) => void;
  idPrefix?: string;
}) {
  const provinceId: string = form.watch("provinceId") || "";
  const cityId: string = form.watch("cityId") || "";
  const localityId: string = form.watch("localityId") || "";
  const placesQuery = usePlaces(provinceId ? Number(provinceId) : null);
  const places = placesQuery.data || [];
  const { cities } = buildCityTree(places);
  const onlyCity = cities.length === 1 ? cities[0] : null;
  const city = cities.find((c) => String(c.id) === cityId);
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;

  const set = (name: string, value: string) =>
    form.setValue(name, value, { shouldValidate: !!value, shouldDirty: true, shouldTouch: true });

  // Edit mode: derive the city from a saved locality.
  useEffect(() => {
    if (!places.length || cityId || !localityId) return;
    const saved = places.find((p) => String(p.id) === localityId);
    if (saved) set("cityId", String(saved.parentId ?? saved.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.length, cityId, localityId]);

  // Single-city province (Islamabad): pick the city automatically.
  useEffect(() => {
    if (onlyCity && cityId !== String(onlyCity.id)) {
      set("cityId", String(onlyCity.id));
      if (!onlyCity.localities.some((l) => String(l.id) === localityId)) set("localityId", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyCity?.id, cityId]);

  // A city without separate localities: file the business under the city.
  useEffect(() => {
    if (city && city.localities.length === 0 && localityId !== String(city.id)) set("localityId", String(city.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.id, city?.localities.length, localityId]);

  const label = "mb-1.5 block text-sm font-medium text-[#0A0A0A]";
  const select = "yp-input w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-60";
  const err = (name: string) =>
    errors[name]?.message ? <p className="mt-1.5 text-sm font-medium text-[#B91C1C]" role="alert">{String(errors[name]?.message)}</p> : null;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div>
        <label htmlFor={`${idPrefix}-province`} className={label}>{country.regionTerm.singular} *</label>
        <select
          id={`${idPrefix}-province`}
          className={select}
          value={provinceId}
          aria-invalid={!!errors.provinceId}
          onChange={(e) => {
            set("provinceId", e.target.value);
            set("cityId", "");
            set("localityId", "");
            onProvinceChange?.(e.target.value);
          }}
        >
          <option value="">Select {country.regionTerm.singular.toLowerCase()}</option>
          {provinces.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>
        {err("provinceId")}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-city`} className={label}>City *</label>
        {onlyCity ? (
          <p id={`${idPrefix}-city`} className="flex min-h-[44px] items-center rounded-[10px] border border-[#E7E9EE] bg-[#F7F8FA] px-3 text-[15px] text-[#3A4354]">
            {onlyCity.name}
          </p>
        ) : (
          <select
            id={`${idPrefix}-city`}
            className={select}
            value={cityId}
            disabled={!provinceId || placesQuery.isLoading}
            aria-invalid={!!errors.cityId}
            onChange={(e) => {
              set("cityId", e.target.value);
              set("localityId", "");
            }}
          >
            <option value="">{!provinceId ? `Select a ${country.regionTerm.singular.toLowerCase()} first` : placesQuery.isLoading ? "Loading cities…" : "Select city"}</option>
            {cities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        )}
        {err("cityId")}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-locality`} className={label}>Locality *</label>
        {city && city.localities.length === 0 ? (
          <p id={`${idPrefix}-locality`} className="flex min-h-[44px] items-center rounded-[10px] border border-[#E7E9EE] bg-[#F7F8FA] px-3 text-sm text-[#3A4354]">
            {city.name} (no separate localities)
          </p>
        ) : (
          <select
            id={`${idPrefix}-locality`}
            className={select}
            value={localityId}
            disabled={!city}
            aria-invalid={!!errors.localityId}
            onChange={(e) => set("localityId", e.target.value)}
          >
            <option value="">{city ? "Select locality" : "Select a city first"}</option>
            {city?.localities.map((l) => <option key={l.id} value={String(l.id)}>{shortPlaceName(l, city)}</option>)}
          </select>
        )}
        {err("localityId")}
      </div>
    </div>
  );
}

export default LocationPicker;
