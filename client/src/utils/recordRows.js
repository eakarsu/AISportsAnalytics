// Collection endpoints may return either a bare list or a paginated response.
export default function recordRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}
