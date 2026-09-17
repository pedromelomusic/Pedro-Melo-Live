export const photoSlots = ['home', 'pedro', 'giants', 'pete'] as const;
export type PhotoSlot = typeof photoSlots[number];
export function photoSlot(r: Request): PhotoSlot | null {
  const params = new URL(r.url).searchParams, slot = params.get('slot');
  return params.getAll('slot').length === 1 && photoSlots.includes(slot as PhotoSlot) ? slot as PhotoSlot : null;
}
export const photoKey = (slot: PhotoSlot) => 'project-photography/v1/' + slot;
