# Breeze 语音朗读 · DSH 插件

把 [Breeze Blue](https://breezeblue.ai) 的文字转语音接进 DeepSeek Harness：代理可以朗读，回复可以一键播放，音色和语气都能在设置页里调，还能用文字描述现捏一个新音色。

## 安装

```bash
dsh plugin --profile desktop add @eslaykey/dsh-breeze-tts
```

装完**重启 DSH**。然后进「设置 → 语音朗读」，在顶部填入 Breeze 的 API key（`brz_` 开头）点「连接」，成功会显示当前余额。

API key 在这里申请：<https://breezeblue.ai/app/developer/api-keys>

## 能做什么

| 能力 | 位置 |
|---|---|
| `tts_speak` | 代理把一段文字念出来，也可以只落成文件 |
| `tts_voices` | 列出账号可用的音色，可按语言/关键词筛 |
| `tts_status` | 查当前音色、今日用量、剩余 credits |
| 回复朗读 | 每条助手回复下方的「朗读这条」 |
| 自动朗读 | 输入框下方状态条按设定字数自动念新回复（默认关） |
| 音色设置 | 设置 → 语音朗读：音色、语气、试听、每日上限、余额 |
| 音色设计 | 用一段文字描述生成三个候选音色，试听后可保存 |

## 配置

运行时配置写在 `~/.dsh/breeze.json`，插件补丁里的 `config` 只是出厂默认：

```json
{
  "apiKey": "brz_...",
  "voiceId": "voc_xxxxxxxxxxxx",
  "modelId": "breeze-tts-2",
  "languageMode": "auto",
  "dailyChars": 3000,
  "autoSpeak": false,
  "autoSpeakMaxChars": 120
}
```

- `languageMode`：`auto` 按句识别中英混排，也可以写死 `zh` / `en`
- `dailyChars`：**硬闸门**，当天合成字数超了就拒绝，防止额度意外消耗
- `autoSpeakMaxChars`：只有不超过这个字数的回复才会被自动朗读

## 费用

按字符计费，10 个计费单位 = 1 credit，中日韩字符算 2 个单位。实测约 **0.19 credits / 汉字**。
免费档每天可以在官网手动领 400 credits（≈2000 汉字）。插件自带两级闸门：单次字数限制 + 每日上限。

## 隐私

文字只发给 `api.breeze.blue` 做合成；生成的音频在本机缓存于 `~/.dsh/breeze-tts/`，不会上传到其他地方。API key 只保存在本机配置文件里。

## 已知限制

- 朗读与自动朗读依赖本机播放能力，仅桌面端可用
- 自定义音色占用 Breeze 账号的音色槽（免费档 5 个）
- DSH 桌面版没有页面刷新，插件更新后需要重启

## Troubleshooting

**安装时报 `ERR_PNPM_IGNORED_BUILDS`**

pnpm 12+ 只要依赖树里还有一个包的构建脚本“未表态”，就会让整个安装事务失败回滚——这时报错的包不一定是本插件。检查 profile 的 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  some-package@https://...: false   # 必须是 true 或 false，不能留占位文本
```

把每个条目补成 `true` 或 `false` 后重试安装。

**装上之后没有声音**

本插件的播放走宿主的系统播放器（Windows `winmm.PlaySound`），只接受 WAV。如果机器上没有可用的音频输出设备，或宿主进程被限制调用子进程，会失败但不报错。可以查看 `~/.dsh/breeze-tts/last-play.log` 确认播放器是否真的启动过。

**合成返回 401 / 403**

API key 无效或已过期。到 <https://breezeblue.ai/app/developer/api-keys> 重新生成，回到设置页重新「连接」，或者直接写进 `~/.dsh/breeze.json` 的 `apiKey`。

**合成返回 502 / 503 / 504**

这是 Breeze 服务端的问题，不是本机故障：网关在时限内没等到源站响应。插件会自动重试一次；仍然失败就稍后再试。余额和音色列表这类免费接口此时通常仍然可用，所以「余额正常但试听报错」不代表 key 有问题。

## 开发

```bash
git clone <this repo>
cd dsh-breeze-tts
dsh plugin --profile desktop add .   # 以链接方式装进 profile，改完重启生效
```

改 Host 代码必须重启 DSH；改 Client 代码同样要重启（DSH 桌面版没有页面刷新）。

## License

MIT
