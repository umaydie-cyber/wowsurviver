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
- GitHub Pages 自动部署，以及可选的 Vercel 配置

完整规则及模块说明见 [GAME_SPEC.md](./GAME_SPEC.md)。当前美术由运行时生成的占位纹理构成，后续可直接改为 `assets/` 下的正式资源。

## GitHub Pages 部署

1. 推送至 `main`，工作流会自动启用 GitHub Pages，然后依次执行安装、测试、构建并发布 `dist`。
2. 部署完成后访问 <https://umaydie-cyber.github.io/wowsurviver/>。

如果仓库策略禁止工作流自动启用 Pages，请在仓库 **Settings → Pages → Build and deployment** 中手动将 Source 设为 **GitHub Actions**，再重新运行失败的工作流。

Pages 构建会把 Vite 的资源基础路径设为 `/wowsurviver/`，避免项目站点子路径下的脚本和样式 404。也可直接在 Vercel 导入仓库；默认本地与 Vercel 构建仍使用根路径，`vercel.json` 已提供 SPA 回退规则。
