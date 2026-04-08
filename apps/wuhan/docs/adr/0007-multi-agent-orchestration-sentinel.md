# ADR-0007: 多Agent协作编排与哨兵监督架构

- **状态**: 已批准，待实施
- **日期**: 2026-03-24
- **参与决策者**: Claude (Opus)、Codex CLI、人类用户
- **关联文档**: `.sentinel/` 目录下的协议文件

---

## 1. 背景与目标

### 1.1 业务背景

本项目（广东省海洋灾害综合决策系统）正在快速迭代，需求复杂度持续上升。单个 AI agent 独立工作存在盲点风险，需要引入多 agent 协作机制来提升方案质量和实施可靠性。

### 1.2 核心目标

建立一套 **Claude 主控 + 多 agent 协作 + 独立哨兵监督** 的工作流体系，满足：

1. **复杂需求分治**: 一个需求可拆分给多个 agent 并行生成方案
2. **对抗式审查**: 多方案竞争、交叉审查，达成共识后才推进
3. **全程可见**: 所有 agent 交互过程人类可实时观察，不是黑盒
4. **防跑偏**: 独立哨兵持续监控，能在关键节点阻断偏离需求的推进
5. **上下文隔离**: 主控 agent 不被子 agent 的噪音污染

---

## 2. 候选方案评估

### 2.1 调研的开源项目

| 项目 | 地址 | 核心能力 | 结论 |
|------|------|----------|------|
| **OpenCLI** | https://github.com/jackwener/opencli | 统一 CLI 入口，Antigravity/Codex 适配器，模型切换 | 有 CCB 后优先级降低，作为备选 |
| **Claude Octopus** | https://github.com/nyldn/claude-octopus | 多 provider 编排，75%共识，双钻石流程，32角色，反应引擎 | 采用，作为编排层 |
| **Superpowers** | https://github.com/obra/superpowers | 子代理驱动开发，TDD纪律，强制工作流 | 与 Octopus 重叠，不采用 |
| **Planning-with-Files** | https://github.com/OthmanAdi/planning-with-files | 文件驱动规划，PreToolUse 钩子强制重读计划 | 采用，作为防跑偏机制 |
| **Claude Code Bridge (CCB)** | https://github.com/bfly123/claude_code_bridge | 分窗终端多模型并行，全交互可见，独立上下文 | 采用，作为可视化执行层 |

### 2.2 方案演进过程

讨论中经历了四个方案迭代：

**方案一: CCB 为主 + 规则下沉到 .md**
- 思路: 不用 Octopus，把编排规则写到 CLAUDE.md
- 否决原因: Claude 遵守复杂自然语言规则不够可靠，缺乏程序化强制

**方案二: 改造 Octopus 内部通道走 CCB**
- 思路: Fork Octopus，替换 provider 层为 CCB 的 ask/pend
- 否决原因: 同步/异步不匹配，改造成本过高，维护负担重

**方案三（最终采用）: Octopus 执行 + CCB 哨兵监督**
- 思路: Octopus 在一个 CCB 窗格内正常运行（半自主模式），另一个窗格运行独立哨兵 Claude
- 关键创新: 执行与监督分离，通过共享文件协议实现跨 agent 控制

---

## 3. 最终架构设计

### 3.1 整体架构

```
+-- CCB 分窗终端 (WezTerm) -----------------------------------+
|                                                              |
|  +--------------------+    +-----------------------------+   |
|  | Claude A (主控)     |    | Claude B (哨兵)              |   |
|  |                    |    |                             |   |
|  | - Octopus 半自主    |    | - 持有 brief.md 副本        |   |
|  | - 内部调度          |    | - 监控 Octopus 日志         |   |
|  |   codex/gemini     |    | - 比对产出物与需求          |   |
|  | - 每阶段更新        |    | - 写 sentinel-alerts.md    |   |
|  |   phase-state.md   |    | - 控制 control.md 状态      |   |
|  | - PreToolUse 钩子   |    |                             |   |
|  |   检查 control.md   |    |                             |   |
|  +--------+-----------+    +-------------+---------------+   |
|           |                              |                   |
|           +------ .sentinel/ 目录 -------+                   |
|                   (共享文件协议)                               |
+--------------------------------------------------------------+
```

### 3.2 工具栈分工

| 层级 | 工具 | 职责 |
|------|------|------|
| **编排执行** | Claude Octopus (半自主模式) | 流程定义、多provider调度、共识机制、质量关卡 |
| **可视化终端** | Claude Code Bridge (CCB) | 多窗格并行、全交互可见、agent 间消息传递 |
| **计划持久化** | Planning-with-Files | task_plan.md 维护、PreToolUse 钩子强制重读 |
| **模型切换** | OpenCLI (备选) | 通过 Antigravity 切换 Gemini/Claude 等模型 |

### 3.3 Octopus 工作流映射

采用双钻石流程，对应 Octopus 的核心命令：

```
需求输入
   |
   v
/octo:research  --> 发现阶段 (多 provider 并行研究)
   |
   v
/octo:debate    --> 定义阶段 (结构化四方辩论，75%共识)
   |
   v
/octo:tdd       --> 开发阶段 (红绿重构，子 agent 实现)
   |
   v
/octo:security  --> 审查阶段 (对抗性审查 + OWASP 扫描)
   |
   v
交付
```

也可使用 `/octo:embrace` 一键全流程，但建议拆分为独立阶段调用以配合哨兵检查点。

---

## 4. 哨兵监督协议（核心设计）

### 4.1 设计原则

> **有效打断靠的不是消息通道，而是三件事：主 agent 有固定检查点、哨兵有明确升级规则、控制信号高于普通任务优先级。**

此原则来自 Codex 的分析，是整个监督机制的理论基础。

### 4.2 三层打断机制

#### 第一层：阶段边界打断（最稳定）

在以下阶段切换点，主 agent **必须**停下来读控制文件：

- Discover → Define
- Define → Develop
- Develop → Review
- Review → Deploy

每个切换点执行：
1. 更新 `phase-state.md`（当前阶段完成状态）
2. 读取 `control.md`（是否允许继续）
3. 读取 `sentinel-alerts.md`（是否有待处理告警）
4. 确认无阻塞后进入下一阶段

#### 第二层：心跳轮询（中等及时）

在以下时机，主 agent 主动检查控制信号：

- 每完成一个 work package
- 每轮 review 结束
- 每次重大决策写入后

检查内容：是否有新的 sentinel-alert、override、stop-the-line。

#### 第三层：硬停止抢占（紧急）

仅对以下高风险条件启用：

1. 偏离原始需求核心目标
2. 跳过阶段门
3. 未解决高严重度问题就推进部署
4. 共识未达标却被宣称达标
5. 测试/验证失败却继续推进
6. 子 agent 输出和主决策明显冲突

通过 PreToolUse 钩子 + control.md `STOP_THE_LINE` 状态实现物理阻断。

### 4.3 打断时机选择原则

| 偏差程度 | 打断时机 | 机制 |
|----------|----------|------|
| 常规偏差 | 阶段边界 | phase-state.md 检查 |
| 中度偏差 | 心跳点 | sentinel-alerts.md 检查 |
| 严重偏差 | 立即抢占 | control.md STOP_THE_LINE + PreToolUse 钩子 |

---

## 5. 文件协议规范

### 5.1 目录结构

```
.sentinel/
├── brief.md                    -- 需求真本（双方只读）
├── intervention-policy.md      -- 干预策略定义（双方只读）
├── phase-state.md              -- 主 agent 写，哨兵读
├── main-agent-response.md      -- 主 agent 写，哨兵读（告警回应通道）
├── sentinel-alerts.md          -- 哨兵写，主 agent 读
├── control.md                  -- 哨兵写，主 agent 读（钩子检查）
└── review-log.md               -- 哨兵写，主 agent 读（审计记录）
```

### 5.2 文件权限矩阵

| 文件 | 主 Agent | 哨兵 | 说明 |
|------|----------|------|------|
| brief.md | 只读 | 只读 | 需求真本，任何人不可修改 |
| intervention-policy.md | 只读 | 只读 | 干预规则，提前约定 |
| phase-state.md | 读写 | 只读 | 主 agent 更新阶段进度 |
| main-agent-response.md | 读写 | 只读 | 主 agent 对告警的正式回应 |
| sentinel-alerts.md | 只读 | 读写 | 哨兵写入告警 |
| control.md | 只读 | 读写 | 哨兵控制运行状态 |
| review-log.md | 只读 | 读写 | 哨兵审查记录 |

**单向写入，避免冲突。** 主 agent 永远不改 control.md，哨兵永远不改 phase-state.md。

### 5.3 control.md 状态机

```
RUN ──(哨兵发现中度偏差)──> PAUSE
 ^                           |
 |                           v
 |    (哨兵确认纠偏方案)    主 agent 在下一个检查点暂停
 +---------------------------+

RUN ──(哨兵发现严重偏差)──> STOP_THE_LINE
                              |
                              v
                     PreToolUse 钩子物理阻断变更类操作
                     主 agent 只能读取 + 写回应
                              |
                              v
                     主 agent 写 main-agent-response.md
                              |
                              v
                        ACK_PENDING
                              |
                     哨兵审核回应，确认纠偏方案
                              |
                              v
                            RUN
```

关键规则：
- **只有哨兵能把状态从 STOP_THE_LINE/ACK_PENDING 改回 RUN**
- 主 agent 通过 `main-agent-response.md` 回应，不直接改 control.md

### 5.4 PreToolUse 钩子设计

```jsonc
// Claude Code settings.json hooks 配置
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash|NotebookEdit",
        "command": "bash .sentinel/check-control.sh"
      }
    ]
  }
}
```

**钩子脚本 `.sentinel/check-control.sh`**：

```bash
#!/bin/bash
# 检查哨兵控制状态，STOP_THE_LINE 时阻断变更类操作
CONTROL_FILE=".sentinel/control.md"

if [[ ! -f "$CONTROL_FILE" ]]; then
  exit 0  # 文件不存在时放行
fi

STATUS=$(grep -oP '(?<=status:\s).*' "$CONTROL_FILE" | tr -d ' ')

if [[ "$STATUS" == "STOP_THE_LINE" ]]; then
  echo "BLOCKED: 哨兵触发硬停止。"
  echo "原因: $(grep -oP '(?<=reason:\s).*' "$CONTROL_FILE")"
  echo ""
  echo "允许的操作: 读取文件、查看状态"
  echo "必须的操作: 读取 .sentinel/sentinel-alerts.md，然后写入 .sentinel/main-agent-response.md"
  echo ""
  echo "注意: 如果你需要写 main-agent-response.md，请使用 Read 工具先读取告警，"
  echo "然后在对话中输出你的回应内容，等待人类协助写入回应文件。"
  exit 1
fi

if [[ "$STATUS" == "PAUSE" ]]; then
  echo "WARNING: 哨兵请求暂停。请先读取 .sentinel/sentinel-alerts.md 了解原因。"
  echo "处理完告警后可继续。"
  # PAUSE 不阻断，只是警告
  exit 0
fi

exit 0
```

**关于作用域的关键决策（来自 Codex 修正）**：

钩子只拦截 `Write|Edit|Bash|NotebookEdit`（变更类操作），放行 `Read|Grep|Glob`（只读操作）。这避免了死锁——主 agent 在 STOP_THE_LINE 时仍能读取告警信息和需求文档。

`main-agent-response.md` 的写入问题：STOP_THE_LINE 时 Write 被拦截，主 agent 无法直接写回应文件。解决方案：主 agent 在对话中输出回应内容，由人类（或通过 CCB 的 ask 通道让哨兵）代为写入，或者主 agent 将回应内容告知人类，人类手动更新。这是 V1 的可接受妥协——保证了安全性，代价是多一步人工操作。

---

## 6. Octopus 可抢占性验证（必须先做的实验）

### 6.1 为什么这是第一优先级

如果 Octopus 的 `/octo:embrace` 是"一次长事务"（内部一口气跑完多个阶段），那么 PreToolUse 只能拦住"启动那一下"，拦不住中间的推进。整个哨兵机制的有效性取决于这个验证结果。

### 6.2 验证步骤

```
1. 安装 Octopus:
   claude plugin marketplace add https://github.com/nyldn/claude-octopus.git
   claude plugin install octo@nyldn-plugins
   /octo:setup

2. 创建一个简单测试需求（如"给项目添加一个 hello world API"）

3. 使用 /octo:embrace 启动，设置为半自主模式

4. 观察 Discover 阶段完成后：
   - 是否回到了等待输入的状态？ → 情况A（可抢占）
   - 是否直接继续到 Define？ → 情况B（不可抢占）

5. 如果情况A：在等待间隙修改 control.md 为 STOP_THE_LINE
   → 看下一阶段启动时 PreToolUse 是否拦住

6. 如果情况B：改用分步调用
   → /octo:research → 手动检查 → /octo:debate → ...
```

### 6.3 如果不可抢占的降级策略

将 Octopus 从"长事务"切为"短事务"：

```
不用: /octo:embrace（全流程一键）
改用: 分步手动调用

/octo:research "需求描述"    → 完成 → 检查点 → 哨兵审查
/octo:debate "方案对比"      → 完成 → 检查点 → 哨兵审查
/octo:tdd "实现任务"         → 完成 → 检查点 → 哨兵审查
/octo:security "安全审查"    → 完成 → 检查点 → 哨兵审查
```

每步之间控制权回到 Claude Code 主循环，PreToolUse 有机会生效。

---

## 7. 实施路线图

### V1: 最小可行方案（第一周）

| 步骤 | 内容 | 依赖 |
|------|------|------|
| 1 | 安装 CCB (WezTerm 终端) | 无 |
| 2 | 安装 Octopus 插件 | CCB |
| 3 | 安装 Planning-with-Files 插件 | 无 |
| 4 | 创建 `.sentinel/` 目录和 7 个协议文件 | 无 |
| 5 | 配置 PreToolUse 钩子 (check-control.sh) | .sentinel/ |
| 6 | **执行可抢占性验证实验** | Octopus |
| 7 | 在 CLAUDE.md 中添加主 agent 编排规则 | 验证结果 |
| 8 | 编写哨兵 agent 的 system prompt | .sentinel/ |
| 9 | 端到端测试：用一个小需求跑通全流程 | 全部 |

### V2: 心跳自动化（第二-三周）

- 哨兵自动定时检查 Octopus 日志
- 自动对比产出物与 brief.md
- 心跳脚本触发（每 60 秒或每个 work package 完成时）

### V3: 高级编排（第四周+）

- 自定义 CCB skill（`/consensus`、`/adversarial-review`）
- 哨兵全自动运行（不需要人工在 CCB 窗格操作）
- 引入 OpenCLI 的 Antigravity 适配器扩展模型选择

---

## 8. 已知风险与缓解措施

| 风险 | 影响 | 缓解 |
|------|------|------|
| Octopus 不可抢占 | 哨兵无法及时打断 | 降级为分步调用（第6节） |
| PreToolUse 钩子无法获取文件路径参数 | STOP_THE_LINE 时主 agent 无法写回应文件 | V1 由人工代写回应 |
| Windows 兼容性问题 | CCB/Octopus 的 bash 脚本可能不兼容 | 用 Git Bash / WSL 运行 |
| 多模型并行导致 Token 成本高 | 费用上升 | CCB 轻量提示策略 + 控制并行度 |
| 哨兵过度敏感导致频繁 STOP | 主流程被不断打断 | intervention-policy.md 明确阈值 |

---

## 9. 决策记录

| 决策点 | 结论 | 原因 |
|--------|------|------|
| Octopus vs Superpowers | 选 Octopus | 多模型共识机制更完整，Superpowers 侧重 TDD |
| CCB 定位 | 可视化层 + 哨兵通道 | 不做编排，避免与 Octopus 通道冲突 |
| 是否改造 Octopus 内部通道 | 不改造 | 同步/异步不匹配，维护成本过高 |
| 哨兵如何介入 | 文件协议 + PreToolUse 钩子 | 比"随时插话"更可靠，有机制保障 |
| Planning-with-Files 是否引入 | 引入 | 96.7%通过率验证了文件驱动规划的有效性 |
| 第一版哨兵是否自动化 | 不自动化 | 先人工运行验证协议有效性，再自动化 |
