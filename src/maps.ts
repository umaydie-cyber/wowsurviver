export type MapId = 'barrens';

export type MapDefinition = {
  id: MapId;
  name: string;
  region: string;
  description: string;
  color: string;
};

export const MAPS: readonly MapDefinition[] = [
  {
    id: 'barrens',
    name: '贫瘠之地',
    region: '卡利姆多中部',
    description: '穿越干热草原，迎战斑马、半人马、鹰身人与钢鬃野猪人。',
    color: '#d69a43',
  },
] as const;

export function getMap(id: MapId) {
  return MAPS.find(map => map.id === id)!;
}
