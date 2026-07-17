# Azeroth Survivor

一款使用 **Phaser 3 + TypeScript + Vite** 制作的浏览器自动战斗 Roguelike Demo。玩家只需使用 **WASD** 穿梭战场，技能会自动寻找目标并施放。项目目标是以“职业定框架、技能自动触发、天赋定路线、装备改机制、套装定终局”构成一局 20 分钟的 Build 体验。

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
- 狂战士“狂怒”玩法：每 3 秒自动释放以自身为中心的旋风斩，贴身命中与受击产生怒气
- 野狼追击、接触伤害、经验球和等级成长
- 升级暂停与四选一天赋：范围、持续时间、双斧、吸血、命中延时及永久旋转顶点会实际改变技能机制
- HUD 显示职业、自动技能与怒气资源，旋风斩拥有跟随角色的范围及双斧旋转表现
- 5 分钟熔岩巨兽 Boss、HUD、死亡与重开
- GitHub Pages 自动部署，以及可选的 Vercel 配置

完整规则及模块说明见 [GAME_SPEC.md](./GAME_SPEC.md)。当前美术由运行时生成的占位纹理构成，后续可直接改为 `assets/` 下的正式资源。

## GitHub Pages 部署

1. 在仓库 **Settings → Pages → Build and deployment** 中，将 Source 设为 **GitHub Actions**。
2. 推送至 `main`，工作流会依次执行安装、测试、构建并发布 `dist`。
3. 部署完成后访问 <https://umaydie-cyber.github.io/wowsurviver/>。

Pages 构建会把 Vite 的资源基础路径设为 `/wowsurviver/`，避免项目站点子路径下的脚本和样式 404。也可直接在 Vercel 导入仓库；默认本地与 Vercel 构建仍使用根路径，`vercel.json` 已提供 SPA 回退规则。
