# Azeroth Survivor

一款使用 **Phaser 3 + TypeScript + Vite** 制作的浏览器自动战斗 Roguelike Demo。玩家扮演影踪武僧，只需使用 **WASD** 穿梭战场；火焰之息会自动追踪敌人。

## 开始游戏

要求 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

生产验证：

```bash
npm test
npm run build
```

## 已实现

- WASD 移动、无限战场视觉效果与跟随镜头
- 自动寻找最近目标并释放火焰之息
- 野狼追击、接触伤害、经验球和等级成长
- 升级暂停与三选一强化
- 5 分钟熔岩巨兽 Boss、HUD、死亡与重开
- Vercel 配置和 GitHub Actions 构建/部署

完整规则及模块说明见 [GAME_SPEC.md](./GAME_SPEC.md)。当前美术由运行时生成的占位纹理构成，后续可直接改为 `assets/` 下的正式资源。

## 部署

1. 在 Vercel 创建项目并记下项目、组织 ID。
2. 在 GitHub 仓库中配置 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` 三个 Actions Secrets。
3. 推送至 `main`，工作流会依次执行安装、测试、构建，并部署生产版本。

也可直接在 Vercel 导入仓库；`vercel.json` 已提供 SPA 回退规则。仓库及线上地址需由仓库所有者创建/绑定后获得。
