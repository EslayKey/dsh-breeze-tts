window.__ModuleLoader__.load({
  id: '@eslaykey/dsh-breeze-tts',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-breeze-tts'
    const ENDPOINT = '/breeze-tts'

    const DICT = {
      zh: {
        meta: { title: 'Breeze 语音朗读', description: '用 Breeze Blue 把文字念出来。' },
        section: { title: '语音朗读', subtitle: 'Breeze Blue · 文字转语音' },
        tone: { normal: '自然', warm: '温和', formal: '正式', lively: '活泼' },

        err: {
          server: 'Breeze 服务端暂时不可用或响应超时，请稍后重试',
          auth: 'API key 无效或已失效，请重新填写',
          rate: '请求太频繁，稍等几秒再试',
          credits: '积分余额不足，请先充值或调低每日上限',
          tooShort: '音色描述和试听台词至少要 3 个字',
          daily: '已到今日字数上限，可在设置中调高',
        },

        label: {
          voice: '音色', mood: '情绪', previewText: '试听文案', dailyLimit: '每日字数上限',
          balance: '剩余额度', todayUsage: '今日已用', preview: '试听', save: '保存设置',
          saving: '保存中…', synthesizing: '合成中…', refresh: '刷新', designed: '自捏',
          readAloud: '朗读这条', replay: '重播上一条', replayEmpty: '还没有可重播的音频', saved: '已保存 ✓',
        },
        status: { ready: '就绪', missingKey: '缺少 API key', credits: 'credits', chars: '字' },
        hint: { key: '把 Breeze API key 写进 ~/.dsh/breeze.json 的 apiKey 字段。', limit: '超过上限会拒绝合成，避免意外烧额度。' },
        extra: {
          autoSpeak: '自动朗读',
          autoSpeakHint: '对字数不超过设定值的新回复自动朗读，默认关闭',
          renameBlocked: '内置音色和公开音色不能重命名',
          voiceManageHint: '只有你自己生成的音色可以在这里改名或删除',
          apiKey: 'API Key',
          keyBound: '已连接',
          keyMissing: '尚未连接，填入 Breeze 的 API key 后点连接',
          keyRequired: '请先填入 API key',
          keyConnected: '连接成功',
          keyDisconnected: '已断开',
          connect: '连接',
          disconnect: '断开',
          cloneNotice: '本插件不提供音色克隆。需要克隆自己的声音，请到 Breeze 官网的音色库创建，克隆好的音色会自动出现在上面的列表里。',
          renameVoice: '重命名',
          renamePlaceholder: '新的音色名称',
          saveName: '保存名称',
          voiceRenamed: '已重命名 ✓',
          voiceLoadedTag: '已加载',
          voiceNamePlaceholder: '新音色名称',
          addedTag: '已添加',
          voiceAdded: '已加入音色库',
          voiceRemoved: '已从音色库移除',
          emotionMode: '语气模式',
          emotionSaved: '语气模式已切换',
          emotionFixed: '固定',
          emotionInfer: '智能推断',
          emotionMarker: '模型标注',
          emotionFixedHint: '全程使用上面选中的语气朗读，不做任何切换',
          emotionInferHint: '按标点自动切换：问号→好奇、感叹号→兴奋、省略号→失落；分段变多会拖慢生成',
          emotionMarkerHint: '由模型在回复里插入标记，指定某一段的语气；分段变多会拖慢生成',
          emotionMarkerNote: '模型标注为实验性功能：由模型自行标注语气，可能出现标记显形或判断偏差。',
          publicVoices: '公开音色',
          publicVoicesHint: '插件默认只显示你自建的音色，公共目录另外浏览',
          openLibrary: '更多公开音色',
          collapseLibrary: '收起音色库',
          libraryTitle: '官方音色库',
          librarySubtitle: '默认以自然语气试听',
          librarySearch: '按名称或描述搜索',
          libraryEmpty: '没有匹配的音色',
          loadVoice: '加载',
          voiceLoaded: '已切换音色',
          newTone: '新建语气',
          editTone: '编辑',
          deleteTone: '删除',
          saveTone: '保存语气',
          cancel: '取消',
          customTag: '自定义',
          deleteVoice: '删除音色',
          toneNamePlaceholder: '语气名称，例如：哄睡',
          tonePlaceholder: '描述这个语气怎么说话，例如：语速很慢，声音放轻，句尾拖长，像在哄人睡觉。',
          toneIncomplete: '名称和描述都要填',
          toneSaved: '语气已保存 ✓',
          toneDeleted: '语气已删除',
          voiceDeleted: '音色已删除',
          customMood: '自定义语气',
          customMoodHint: '填写后优先于上面的预设；留空则使用选中语气',
          customMoodPlaceholder: '例如：像在跟小孩子说话，句尾轻轻上扬',
          backgroundPlay: '后台播放',
          backgroundPlayHint: '关闭时只在 DSH 位于前台时朗读；开启后窗口切到后台也会继续播报',
          autoMax: '自动朗读字数',
          autoMaxWarning: '每条回复都会被完整合成；当前字数较多，生成会更慢、积分消耗也更多，建议先用较小值试几条。',
          autoMaxHint: '可输入 0–99999，滑条范围 0–1000',
          refreshed: '已刷新',
          refreshFailed: '刷新失败',
          autoMaxHard: '朗读超长文本会明显拖慢生成速度，积分消耗也难以预估，建议同时设好每日字数上限。',

          autoOn: '自动朗读开',
          designTitle: '音色设计',
          designPlaceholder: '描述你想要的音色本身，不要写台词。建议覆盖年龄、性别、音色质地、语速和情绪基调。例如二十多岁的女性，声音清亮略带鼻音，说话轻快，句尾微微上扬，整体亲切有活力。',
          designSample: '试听台词（可选）',
          designCost: '每轮约 3–8 credits',
          designHint: '生成按试听台词长度计费一次；保存后占用一个音色槽，免费档只有 5 个。',
          generate: '生成',
          generating: '生成中…',
          candidate: '候选',
          saveVoice: '保存为音色',
          voiceSaved: '已保存为新音色',
          newVoice: '我的音色',
          designEmpty: '没有拿到候选，稍后再试',
        },
      },
      en: {
        meta: { title: 'Breeze Voice', description: 'Read text aloud with Breeze Blue.' },
        section: { title: 'Voice', subtitle: 'Breeze Blue · text to speech' },
        tone: { normal: 'Natural', warm: 'Warm', formal: 'Formal', lively: 'Lively' },

        err: {
          server: 'The Breeze service is unavailable or timed out. Try again in a moment.',
          auth: 'The API key is invalid or expired. Please enter it again.',
          rate: 'Too many requests. Wait a few seconds and retry.',
          credits: 'Not enough credits. Top up or lower the daily limit.',
          tooShort: 'Voice description and preview line need at least 3 characters.',
          daily: 'Daily character limit reached. Raise it in settings.',
        },

        label: {
          voice: 'Voice', mood: 'Mood', previewText: 'Preview line', dailyLimit: 'Daily character limit',
          balance: 'Credits left', todayUsage: 'Used today', preview: 'Preview', save: 'Save settings',
          saving: 'Saving…', synthesizing: 'Synthesizing…', refresh: 'Refresh', designed: 'Designed',
          readAloud: 'Read aloud', replay: 'Replay', replayEmpty: 'Nothing to replay yet', saved: 'Saved ✓',
        },
        status: { ready: 'Ready', missingKey: 'Missing API key', credits: 'credits', chars: 'chars' },
        hint: { key: 'Write the Breeze API key into apiKey of ~/.dsh/breeze.json.', limit: 'Synthesis is refused past the limit so credits cannot run away.' },
        extra: {
          apiKey: 'API key',
          keyBound: 'Connected',
          keyMissing: 'Not connected. Paste your Breeze API key and press Connect.',
          keyRequired: 'Enter an API key first',
          keyConnected: 'Connected',
          keyDisconnected: 'Disconnected',
          connect: 'Connect',
          disconnect: 'Disconnect',
          autoSpeak: 'Auto speak',
          autoSpeakHint: 'Automatically read new replies within the configured character limit. Off by default.',
          renameBlocked: 'Built-in and public voices cannot be renamed',
          voiceManageHint: 'Only voices you created can be renamed or deleted here',
          cloneNotice: 'Voice cloning is not part of this plugin. Create a clone on the Breeze website and it will show up in the list above.',
          renameVoice: 'Rename',
          renamePlaceholder: 'New voice name',
          saveName: 'Save name',
          voiceRenamed: 'Renamed',
          voiceLoadedTag: 'Loaded',
          voiceNamePlaceholder: 'New voice name',
          addedTag: 'added',
          voiceAdded: 'Added to your voices',
          voiceRemoved: 'Removed from your voices',
          emotionMode: 'Tone mode',
          emotionSaved: 'Tone mode switched',
          emotionFixed: 'Fixed',
          emotionInfer: 'Infer',
          emotionMarker: 'Model tagged',
          emotionFixedHint: 'Speak everything with the tone selected above, no switching',
          emotionInferHint: 'Switch by punctuation: question → curious, exclamation → excited, ellipsis → sad; more segments means slower synthesis',
          emotionMarkerHint: 'The model inserts markers to pick the tone per segment; more segments means slower synthesis',
          emotionMarkerNote: 'Model tagging is experimental: the model tags its own tone. Markers may appear in the text or be misjudged.',
          publicVoices: 'Public voices',
          publicVoicesHint: 'Only your own voices are listed by default; the public catalog is browsed separately',
          openLibrary: 'Browse public voices',
          collapseLibrary: 'Collapse library',
          libraryTitle: 'Public voice library',
          librarySubtitle: 'Previews use the natural tone',
          librarySearch: 'Search by name or description',
          libraryEmpty: 'No matching voices',
          loadVoice: 'Load',
          voiceLoaded: 'Voice switched',
          newTone: 'New tone',
          editTone: 'Edit',
          deleteTone: 'Delete',
          saveTone: 'Save tone',
          cancel: 'Cancel',
          customTag: 'custom',
          deleteVoice: 'Delete voice',
          toneNamePlaceholder: 'Tone name, e.g. bedtime',
          tonePlaceholder: 'Describe how it should sound, e.g. very slow and soft, with a trailing lilt.',
          toneIncomplete: 'Both name and description are required',
          toneSaved: 'Tone saved',
          toneDeleted: 'Tone deleted',
          voiceDeleted: 'Voice deleted',
          customMood: 'Custom tone',
          customMoodHint: 'Overrides the preset above when filled; leave empty to use the selected tone',
          customMoodPlaceholder: 'e.g. speak to a small child, with a light upward lilt',
          backgroundPlay: 'Play in background',
          backgroundPlayHint: 'Off: only speak while DSH is in the foreground. On: keep speaking when the window is in the background.',
          autoMax: 'Auto speak up to',
          autoMaxWarning: 'Every reply is synthesized in full; with this many characters synthesis gets slower and costs more credits. Try a smaller value first.',
          autoMaxHint: '0-99999 allowed, slider covers 0-1000',
          refreshed: 'Refreshed',
          refreshFailed: 'Refresh failed',
          autoMaxHard: 'Very long replies slow synthesis down and make credit use unpredictable. Set a daily limit alongside it.',

          autoOn: 'auto on',
          designTitle: 'Voice design',
          designPlaceholder: 'Describe the voice itself, not a script: age and gender, texture, pace, emotional baseline. Example: a woman in her twenties, bright voice with a light nasal tone, quick and upbeat.',
          designSample: 'Preview line (optional)',
          designCost: 'about 3-8 credits per run',
          designHint: 'Generation is billed once by the preview line length; saving a voice uses one voice slot (the free plan has 5).',
          generate: 'Generate',
          generating: 'Generating…',
          candidate: 'Candidate',
          saveVoice: 'Save voice',
          voiceSaved: 'Saved as a new voice',
          newVoice: 'My voice',
          designEmpty: 'No candidates came back, try again later',
        },
      },
    }

    function lookup(dict, key) {
      let current = dict
      for (const part of key.split('.')) {
        if (current && typeof current === 'object' && part in current) current = current[part]
        else return key
      }
      return typeof current === 'string' ? current : key
    }

    function flatten(dict, prefix, out) {
      const target = out || {}
      for (const key of Object.keys(dict)) {
        const value = dict[key]
        const next = prefix ? prefix + '.' + key : key
        if (value && typeof value === 'object') flatten(value, next, target)
        else target[next] = value
      }
      return target
    }

    const FLAT = { zh: flatten(DICT.zh), en: flatten(DICT.en) }

    const COLOR = {
      primary: 'var(--dsw-alias-label-primary)',
      secondary: 'var(--dsw-alias-label-secondary)',
      border: 'var(--dsw-alias-border-l1)',
      borderStrong: 'var(--dsw-alias-border-l2)',
      surface: 'var(--dsw-alias-bg-layer-1)',
      nested: 'var(--dsw-alias-bg-layer-2)',
      brand: 'var(--dsw-alias-brand-primary)',
      error: 'var(--dsw-alias-state-error-primary)',
      success: 'var(--dsw-alias-state-success-primary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
    }

    async function api(route, options) {
      const response = await fetch(ENDPOINT + route, options)
      const type = response.headers.get('content-type') || ''
      if (type.includes('application/json')) {
        const data = await response.json()
        if (!response.ok) {
          const failure = new Error(data.error || `HTTP ${response.status}`)
          failure.code = data.code || ''
          failure.status = data.status || response.status
          throw failure
        }
        return data
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.blob()
    }

    function humanError(t, error) {
      const message = error instanceof Error ? error.message : String(error)
      const code = error && error.code ? String(error.code) : ''
      const status = error && error.status ? Number(error.status) : 0
      if (status === 401 || code === 'AUTH_REQUIRED') return t('err.auth')
      if (status === 429) return t('err.rate')
      if (status === 402 || /credit/i.test(code) || /insufficient/i.test(message)) return t('err.credits')
      if (status >= 500 || /50[234]/.test(message)) return t('err.server')
      if (/at least 3 characters/i.test(message)) return t('err.tooShort')
      if (/daily limit/i.test(message)) return t('err.daily')
      return message
    }

    let currentAudio = null

    function playUrl(url) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(url)
        currentAudio = audio
        audio.onerror = () => reject(new Error('audio element failed'))
        const started = audio.play()
        if (started && typeof started.then === 'function') started.then(() => resolve(true), reject)
        else resolve(true)
      })
    }

    async function speakRemotely(payload, options) {
      const data = await api('/synth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const playOnHost = async () => {
        await api('/play-file', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: data.url }),
        })
      }
      if (options && options.host) {
        await playOnHost()
        return data
      }
      try {
        await playUrl(data.url)
      } catch (error) {
        console.error('[breeze-tts] html audio failed, using host playback', error)
        await playOnHost()
      }
      return data
    }

    function PlayGlyph(size) {
      const s = size || 11
      return h("svg", {
        width: s, height: s, viewBox: "0 0 12 12", "aria-hidden": true, style: { display: "block", shapeRendering: "geometricPrecision" },
      }, h("path", { d: "M2.4 1.2 10.6 6 2.4 10.8z", fill: "currentColor" }))
    }

    function PlayTriangle(size) {
      const s = size || 12
      return h('svg', {
        width: s, height: s, viewBox: '0 0 12 12', 'aria-hidden': true, style: { display: 'block', shapeRendering: 'geometricPrecision' },
      }, h('path', { d: 'M3.4 2.1 9.6 6 3.4 9.9z', fill: 'currentColor' }))
    }

    async function playBlob(blob) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) throw new Error('AudioContext unavailable')
      const context = new Ctx()
      try {
        if (context.state === 'suspended') await context.resume()
      } catch {
        /* resume best effort */
      }
      const buffer = await context.decodeAudioData(await blob.arrayBuffer())
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      await new Promise((resolve, reject) => {
        source.onended = () => {
          context.close().catch(() => {})
          resolve(true)
        }
        try {
          source.start()
        } catch (error) {
          reject(error)
        }
      })
      return true
    }

    function SpeakerIcon(size) {
      const s = size || 14
      return h('svg', {
        width: s, height: s, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block', shapeRendering: 'geometricPrecision' },
      },
      h('path', { d: 'M8 2.5 4.5 5.5H2v5h2.5L8 13.5z' }),
      h('path', { d: 'M11 5.5a3.5 3.5 0 0 1 0 5' }),
      h('path', { d: 'M13 3.5a6 6 0 0 1 0 9' }))
    }

    function Spinner(size) {
      const s = size || 14
      return h("svg", {
        width: s, height: s, viewBox: "0 0 16 16", "aria-hidden": true, style: { display: "block", shapeRendering: "geometricPrecision" },
      },
      h("circle", {
        cx: 8, cy: 8, r: 6, fill: "none", stroke: "currentColor",
        strokeWidth: 1.7, strokeLinecap: "round", strokeDasharray: "9 29",
      }, h("animateTransform", {
        attributeName: "transform", type: "rotate", from: "0 8 8", to: "360 8 8",
        dur: "0.9s", repeatCount: "indefinite",
      })))
    }

    function StyleSheet() {
      return h('style', null,
        '@keyframes dsh-breeze-spin{to{transform:rotate(360deg)}}',
        '.dsh-breeze-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid ' + COLOR.border + '}',
        '.dsh-breeze-row:first-of-type{border-top:0}',
        '.dsh-breeze-key{flex:0 0 132px;font-size:13px;color:' + COLOR.secondary + '}',
        '.dsh-breeze-value{flex:1;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
        '.dsh-breeze-control{font:inherit;font-size:13px;height:30px;padding:0 10px;border-radius:8px;border:1px solid ' + COLOR.borderStrong + ';background:' + COLOR.nested + ';color:' + COLOR.primary + ';min-width:0}',
        '.dsh-breeze-control:focus-visible{outline:2px solid ' + COLOR.brand + ';outline-offset:1px}',
        '.dsh-breeze-chip{font:inherit;font-size:12px;height:26px;padding:0 10px;border-radius:999px;border:0;background:color-mix(in srgb,' + COLOR.primary + ' 9%,transparent);color:' + COLOR.secondary + ';cursor:pointer}',
        '.dsh-breeze-chip:hover{background:color-mix(in srgb,' + COLOR.primary + ' 16%,transparent)}',
        '.dsh-breeze-chip[data-on="true"]{color:' + COLOR.brand + ';background:color-mix(in srgb,' + COLOR.brand + ' 16%,' + COLOR.nested + ')}',
        '.dsh-breeze-btn{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:13px;height:30px;padding:0 12px;border-radius:8px;cursor:pointer;border:0;background:color-mix(in srgb,' + COLOR.primary + ' 9%,transparent);color:' + COLOR.primary + ';background-clip:padding-box}',
        '.dsh-breeze-btn:hover{background:color-mix(in srgb,' + COLOR.primary + ' 16%,transparent)}',
        '.dsh-breeze-btn:active{background:color-mix(in srgb,' + COLOR.primary + ' 22%,transparent)}',
        '.dsh-breeze-btn[data-primary="true"]{background:' + COLOR.brand + ';border-color:' + COLOR.brand + ';color:#fff}',
        '.dsh-breeze-btn:disabled{opacity:.55;cursor:default}',
        '.dsh-breeze-play{display:inline-flex;align-items:center;gap:9px;font:inherit;font-size:13px;font-weight:500;height:34px;padding:0 18px 0 15px;border-radius:10px;cursor:pointer;border:0;background:' + COLOR.primary + ';color:' + COLOR.surface + ';background-clip:padding-box}',
        '.dsh-breeze-play:hover{background:color-mix(in srgb,' + COLOR.primary + ' 86%,' + COLOR.surface + ')}',
        '.dsh-breeze-play:disabled{opacity:.6;cursor:default}',
        '.dsh-breeze-switch{position:relative;width:40px;height:22px;border-radius:999px;border:0;background:color-mix(in srgb,' + COLOR.primary + ' 18%,transparent);cursor:pointer;padding:0;flex:0 0 auto}',
        '.dsh-breeze-switch[data-on="true"]{background:' + COLOR.brand + '}',
        '.dsh-breeze-knob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s ease}',
        '.dsh-breeze-switch[data-on="true"] .dsh-breeze-knob{left:20px}',
        '.dsh-breeze-hint{margin:2px 0 0;font-size:12px;line-height:18px;color:' + COLOR.secondary + '}')
    }

    function useStatus() {
      const [state, setState] = React.useState({ loading: true, data: null, error: null })
      const load = React.useCallback(async (rethrow) => {
        try {
          const data = await api('/status')
          setState({ loading: false, data, error: null })
          return data
        } catch (error) {
          setState({ loading: false, data: null, error: error instanceof Error ? error.message : String(error) })
          if (rethrow) throw error
          return null
        }
      }, [])
      React.useEffect(() => { load() }, [load])
      return [state, load]
    }

    const SKIP_TYPES = ["reasoning", "thinking", "reasoning-delta", "thinking-delta", "redacted-thinking"]

    function collectText(node, out, depth) {
      if (!node || depth > 7) return out
      if (typeof node !== "object") return out
      if (Array.isArray(node)) {
        for (const item of node) collectText(item, out, depth + 1)
        return out
      }
      const type = typeof node.type === "string" ? node.type : (typeof node.kind === "string" ? node.kind : "")
      if (SKIP_TYPES.includes(type)) return out
      if (type === "text" && typeof node.text === "string" && node.text.trim()) {
        out.push(node.text.trim())
        return out
      }
      for (const key of ["content", "message", "blocks", "parts"]) {
        if (node[key]) collectText(node[key], out, depth + 1)
      }
      return out
    }

    function collectAnyText(node, out, depth) {
      if (!node || depth > 6 || typeof node !== "object") return out
      if (Array.isArray(node)) {
        for (const item of node) collectAnyText(item, out, depth + 1)
        return out
      }
      const type = typeof node.type === "string" ? node.type : (typeof node.kind === "string" ? node.kind : "")
      if (SKIP_TYPES.includes(type)) return out
      if (typeof node.text === "string" && node.text.trim()) out.push(node.text.trim())
      for (const key of ["content", "message", "blocks", "parts"]) {
        if (node[key]) collectAnyText(node[key], out, depth + 1)
      }
      return out
    }

function stripEmoji(text) {
  let out = ''
  for (const ch of String(text ?? '')) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x1f000 && cp <= 0x1faff) continue
    if (cp >= 0x2600 && cp <= 0x27bf) continue
    if (cp === 0xfe0f || cp === 0x200d || cp === 0x2b50) continue
    out += ch
  }
  return out
}

function cleanForSpeech(text) {
  let value = String(text ?? '')
  value = value.replace(/<!--[\s\S]*?-->/g, ' ')
  value = value.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  value = value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  value = value.replace(/https?:\/\/[^\s)]+/g, ' ')
  value = value.replace(/`{1,3}[^`]*`{1,3}/g, ' ')
  value = value.replace(/[*_~#>|]+/g, ' ')
  value = stripEmoji(value)
  value = value.replace(/\s+([：，。！？；、）】」》])/g, '$1')
  value = value.replace(/([（【「《])\s+/g, '$1')
  value = value.replace(/\s+/g, ' ')
  return value.trim()
}

    function textBlocks(blocks, out) {
      for (const block of Array.isArray(blocks) ? blocks : []) {
        if (!block || typeof block !== "object") continue
        const type = typeof block.type === "string" ? block.type : (typeof block.kind === "string" ? block.kind : "")
        if (SKIP_TYPES.includes(type)) continue
        if (type === "text" && typeof block.text === "string" && block.text.trim()) out.push(block.text.trim())
      }
      return out
    }

    function pickText(snapshot, messageId) {
      const nodes = snapshot && Array.isArray(snapshot.nodes) ? snapshot.nodes : []
      const target = nodes.find((node) => node && (
        node.id === messageId
        || node.messageId === messageId
        || (node.message && node.message.id === messageId)
      ))
      if (!target) return ""
      const message = target.message && typeof target.message === "object" ? target.message : target
      const direct = textBlocks(message.content, [])
      if (direct.length) return cleanForSpeech(direct.join(String.fromCharCode(10)))
      const typed = collectText(message, [], 0).join(String.fromCharCode(10)).trim()
      if (typed) return typed
      return collectAnyText(message, [], 0).join(String.fromCharCode(10)).trim()
    }

    function SpeakButton(props) {
      const [phase, setPhase] = React.useState('idle')
      const [fail, setFail] = React.useState('')
      const snapshot = typeof props.useChat === 'function'
        ? props.useChat((state) => (state && typeof state === 'object' ? state.legacy : undefined))
        : undefined
      const text = React.useMemo(() => {
        try {
          return pickText(snapshot, props.messageId)
        } catch {
          return ''
        }
      }, [snapshot, props.messageId])
      if (!text) return null
      const speak = async () => {
        setPhase('busy')
        try {
          const data = await speakRemotely({ text: text.slice(0, 600) })
          setPhase('playing')
          const wait = Math.max(1200, Number(data.chars || 0) * 260)
          window.setTimeout(() => setPhase('idle'), wait)
        } catch (error) {
          setPhase('error')
          setFail(error instanceof Error ? error.message : String(error))
          console.error('[breeze-tts] play failed', error)
        }
      }
      return h('button', {
        type: 'button',
        title: phase === 'error' && fail ? fail : props.t('label.readAloud'),
        'aria-label': props.t('label.readAloud'),
        onClick: speak,
        disabled: phase === 'busy',
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 5, font: 'inherit', fontSize: 12,
          height: 26, padding: '0 9px', borderRadius: 999, cursor: 'pointer',
          border: 'none', background: 'color-mix(in srgb, ' + COLOR.primary + ' 9%, transparent)',
          color: phase === 'error' ? COLOR.error : COLOR.secondary,
        },
      }, phase === 'busy' ? Spinner() : SpeakerIcon(13), h('span', null, props.t('label.readAloud')))
    }

    function AutoSpeakChip(props) {
      const t = props.t
      const [state] = useStatus()
      const played = React.useRef(null)
      if (!played.current) {
        const key = 'breeze-tts:spoken:' + (props.sessionId || 'global')
        let stored = null
        try {
          stored = JSON.parse(window.localStorage.getItem(key) || 'null')
        } catch {
          stored = null
        }
        played.current = {
          key,
          ids: new Set(Array.isArray(stored) ? stored : []),
          texts: new Map(),
        }
      }
      const markSpoken = (id, text) => {
        played.current.ids.add(id)
        if (text) played.current.texts.set(text.slice(0, 80), Date.now())
        try {
          const list = Array.from(played.current.ids).slice(-400)
          window.localStorage.setItem(played.current.key, JSON.stringify(list))
        } catch {
          /* storage full or disabled */
        }
      }
      const primed = React.useRef(false)
      const debounce = React.useRef(null)
      const focused = React.useRef(true)
      const snapshot = typeof props.useChat === 'function'
        ? props.useChat((value) => (value && typeof value === 'object' ? value.legacy : undefined))
        : undefined

      React.useEffect(() => {
        const markFocused = () => {
          focused.current = true
        }
        const markBlurred = () => {
          focused.current = false
        }
        const onVisibility = () => {
          if (document.visibilityState === 'hidden') markBlurred()
          else markFocused()
        }
        window.addEventListener('focus', markFocused)
        window.addEventListener('pointerdown', markFocused, true)
        window.addEventListener('keydown', markFocused, true)
        window.addEventListener('blur', markBlurred)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
          window.removeEventListener('focus', markFocused)
          window.removeEventListener('pointerdown', markFocused, true)
          window.removeEventListener('keydown', markFocused, true)
          window.removeEventListener('blur', markBlurred)
          document.removeEventListener('visibilitychange', onVisibility)
        }
      }, [])

      React.useEffect(() => {
        const nodes = snapshot && Array.isArray(snapshot.nodes) ? snapshot.nodes : []
        if (!snapshot) return

        if (!primed.current) {
          primed.current = true
          for (const node of nodes) {
            const id = node && (node.id || node.messageId || (node.message && node.message.id))
            if (id) markSpoken(id, '')
          }
          return
        }

        if (debounce.current) window.clearTimeout(debounce.current)
        debounce.current = window.setTimeout(evaluate, 600)
        return

        function evaluate() {
        let text = ''
        let id = ''
        for (let index = nodes.length - 1; index >= 0; index -= 1) {
          const node = nodes[index]
          if (!node || typeof node !== 'object') continue
          if (String(node.kind || '') !== 'assistant') continue
          const candidateId = node.id || node.messageId || (node.message && node.message.id) || ''
          if (!candidateId || played.current.ids.has(candidateId)) continue
          let raw = ''
          try {
            raw = collectText(node, [], 0).join(' ')
            if (!raw) raw = collectAnyText(node, [], 0).join(' ')
          } catch {
            raw = ''
          }
          const cleaned = cleanForSpeech(raw)
          if (!cleaned) continue
          const recent = played.current.texts.get(cleaned.slice(0, 80))
          if (recent && Date.now() - recent < 60000) {
            markSpoken(candidateId, '')
            continue
          }
          text = cleaned
          id = candidateId
          break
        }
        if (!id) {
          const last = nodes[nodes.length - 1]
          const shape = last && typeof last === 'object' ? Object.keys(last).slice(0, 10).join(',') : 'none'
          const kind = last && typeof last === 'object' ? String(last.kind || last.type || '?') : '?'
          const blocks = last && Array.isArray(last.blocks) ? last.blocks : []
          const probe = blocks[0] && typeof blocks[0] === 'object'
            ? Object.keys(blocks[0]).slice(0, 8).join(',') + '|type=' + String(blocks[0].type || blocks[0].kind || '?')
            : 'none'
          return
        }
        markSpoken(id, text)

        api('/status')
          .then((data) => {
            const limit = Number((data && data.autoSpeakMaxChars) || 0)
            if (!data || !data.autoSpeak) return null
            if (limit <= 0) return null
            if (text.length > limit) return null
            if (!data.backgroundPlay && !focused.current) return null
            return speakRemotely({ text }, { host: true })
          })
          .catch(() => {})
        }
      }, [snapshot])

      const data = state.data
      if (!data) return null
      const used = data.today ? data.today.chars : 0
      const limit = data.today ? data.today.limit : 0
      const tone = data.ok ? COLOR.success : COLOR.error
      const enabled = Boolean(data.autoSpeak)
      const label = data.ok
        ? `${used} / ${limit} ${t('status.chars')}${enabled ? ' · ' + t('extra.autoOn') : ''}`
        : t('status.missingKey')

      return h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 6, padding: '2px 2px 0',
          fontSize: 11, lineHeight: '16px', color: COLOR.secondary,
        },
      },
      h('span', { style: { width: 6, height: 6, borderRadius: 999, background: tone, flex: '0 0 auto' } }),
      h('span', null, label))
    }

    function SettingsPage(props) {
      const t = props.t
      const [state, reload] = useStatus()
      const [voices, setVoices] = React.useState([])
      const [voiceId, setVoiceId] = React.useState('')
      const [moodId, setMoodId] = React.useState('normal')
      const [emotionMode, setEmotionMode] = React.useState('fixed')
      const [tones, setTones] = React.useState([])
      const [savedVoices, setSavedVoices] = React.useState([])
      const [voiceRenameOpen, setVoiceRenameOpen] = React.useState(false)
      const [voiceNameDraft, setVoiceNameDraft] = React.useState('')
      const [designName, setDesignName] = React.useState('')
      const [apiKeyInput, setApiKeyInput] = React.useState('')
      const [connectNote, setConnectNote] = React.useState(null)
      const [voiceNames, setVoiceNames] = React.useState({})
      const [libraryOpen, setLibraryOpen] = React.useState(false)
      const [libraryQuery, setLibraryQuery] = React.useState('')
      const [toneEditor, setToneEditor] = React.useState(false)
      const [toneEditId, setToneEditId] = React.useState('')
      const [toneDraftName, setToneDraftName] = React.useState('')
      const [toneDraftText, setToneDraftText] = React.useState('')
      const [previewText, setPreviewText] = React.useState('')
      const [dailyChars, setDailyChars] = React.useState(1500)
      const [autoSpeak, setAutoSpeak] = React.useState(false)
      const [autoMax, setAutoMax] = React.useState(120)
      const [backgroundPlay, setBackgroundPlay] = React.useState(false)
      const [customMood, setCustomMood] = React.useState('')
      const [designDesc, setDesignDesc] = React.useState('')
      const [designText, setDesignText] = React.useState('')
      const [candidates, setCandidates] = React.useState([])
      const [phase, setPhase] = React.useState('idle')
      const [notice, setNotice] = React.useState('')
      const [refreshNote, setRefreshNote] = React.useState({ text: '', tone: 'muted' })

      React.useEffect(() => {
        const data = state.data
        if (!data) return
        setVoiceId(data.voiceId || '')
        setMoodId(data.moodId || 'normal')
        setEmotionMode(data.emotionMode || 'fixed')
        setTones(Array.isArray(data.tones) ? data.tones : [])
        setSavedVoices(Array.isArray(data.savedVoices) ? data.savedVoices : [])
        setPreviewText(data.previewText || '')
        setDailyChars(data.today ? data.today.limit : 1500)
        setAutoSpeak(Boolean(data.autoSpeak))
        setAutoMax(Number(data.autoSpeakMaxChars || 120))
        setBackgroundPlay(Boolean(data.backgroundPlay))
        setCustomMood(String(data.customMood || ''))
      }, [state.data])

      const hasKey = Boolean(state.data && state.data.hasKey)
      React.useEffect(() => {
        if (!hasKey) return undefined
        let alive = true
        api('/voices')
          .then((data) => { if (alive) setVoices(data.voices || []) })
          .catch(() => { if (alive) setVoices([]) })
        return () => { alive = false }
      }, [hasKey])

      const data = state.data
      const presets = data && Array.isArray(data.voicePresets) ? data.voicePresets : []
      const extra = voices.filter((voice) => !presets.some((preset) => preset.voiceId === voice.voiceId))
      const balance = data && typeof data.balance === 'number' ? data.balance : null
      const used = data && data.today ? data.today.chars : 0
      const limit = data && data.today ? data.today.limit : dailyChars

      const connectKey = async () => {
        const key = apiKeyInput.trim()
        if (!key) {
          setConnectNote({ tone: 'error', text: t('extra.keyRequired') })
          return
        }
        setPhase('connect')
        setConnectNote(null)
        try {
          const result = await api('/connect', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ apiKey: key }),
          })
          setApiKeyInput('')
          setConnectNote({
            tone: 'ok',
            text: t('extra.keyConnected') + (typeof result.balance === 'number' ? ' · ' + result.balance.toFixed(1) + ' ' + t('status.credits') : ''),
          })
          reload()
          const freshVoices = await api('/voices').catch(() => null)
          if (freshVoices && Array.isArray(freshVoices.voices)) setVoices(freshVoices.voices)
        } catch (error) {
          setConnectNote({ tone: 'error', text: humanError(t, error) })
        }
        setPhase('idle')
      }

      const disconnectKey = async () => {
        setPhase('disconnect')
        setConnectNote(null)
        try {
          await api('/disconnect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
          setConnectNote({ tone: 'muted', text: t('extra.keyDisconnected') })
          reload()
        } catch (error) {
          setConnectNote({ tone: 'error', text: humanError(t, error) })
        }
        setPhase('idle')
      }

      const preview = async () => {
        setPhase('preview')
        setNotice('')
        try {
          const result = await speakRemotely({ text: previewText || '你好', toneId: moodId, voiceId })
          setPhase('idle')
          setNotice((result.chars || 0) + ' ' + t('status.chars') + ' · ' + (result.credits || 0) + ' ' + t('status.credits'))
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const save = async () => {
        setPhase('save')
        setNotice('')
        try {
          await api('/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              voiceId,
              moodId,
              emotionMode,
              tones: tones.filter((tone) => !tone.builtin),
              previewText,
              dailyChars: Number(dailyChars),
              autoSpeak,
              autoSpeakMaxChars: Number(autoMax),
              backgroundPlay,
              customMood,
            }),
          })
          setPhase('idle')
          setNotice(t('label.saved'))
          reload()
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const doRefresh = async () => {
        setPhase('refresh')
        setRefreshNote({ text: '', tone: 'muted' })
        try {
          const fresh = await reload(true)
          setPhase('idle')
          const credits = fresh && typeof fresh.balance === 'number' ? ' · ' + fresh.balance.toFixed(1) + ' ' + t('status.credits') : ''
          setRefreshNote({ text: t('extra.refreshed') + credits, tone: 'ok' })
        } catch (error) {
          setPhase('idle')
          setRefreshNote({ text: t('extra.refreshFailed') + ': ' + humanError(t, error), tone: 'error' })
        }
      }

      const generate = async () => {
        setPhase('design')
        setNotice('')
        setCandidates([])
        try {
          const result = await api('/design', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ description: designDesc, text: designText || previewText || '你好' }),
          })
          setCandidates(result.candidates || [])
          setPhase('idle')
          if (!result.candidates || !result.candidates.length) setNotice(t('extra.designEmpty'))
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const saveCandidate = async (candidate) => {
        setPhase('saveVoice')
        setNotice('')
        try {
          const result = await api('/save-voice', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              generatedVoiceId: candidate.generatedVoiceId,
              name: designName.trim() || candidate.name || t('extra.newVoice'),
              description: designDesc,
            }),
          })
          setPhase('idle')
          if (result.voiceId) {
            setVoiceId(result.voiceId)
            setNotice(t('extra.voiceSaved'))
            reload()
            const fresh = await api('/voices').catch(() => null)
            if (fresh && Array.isArray(fresh.voices)) setVoices(fresh.voices)
          }
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const publicVoices = voices.filter((voice) => {
        if (voice.private) return false
        if (presets.some((preset) => preset.voiceId === voice.voiceId)) return false
        const query = libraryQuery.trim().toLowerCase()
        if (!query) return true
        return (voice.name || '').toLowerCase().includes(query)
          || (voice.description || '').toLowerCase().includes(query)
      })

      const loadPublicVoice = async (voice) => {
        const next = savedVoices.some((item) => item.voiceId === voice.voiceId)
          ? savedVoices
          : savedVoices.concat([{
            voiceId: voice.voiceId,
            name: voice.name,
            language: voice.language || '',
            description: voice.description || '',
          }])
        setSavedVoices(next)
        setVoiceId(voice.voiceId)
        setNotice(t('extra.voiceAdded'))
        try {
          await api('/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ savedVoices: next }),
          })
        } catch (error) {
          setNotice(humanError(t, error))
        }
      }

      const audioPreview = async (id) => {
        setPhase('voicePreview')
        setNotice('')
        try {
          await speakRemotely({ text: previewText || '你好', toneId: 'normal', voiceId: id })
          setPhase('idle')
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const activeTone = tones.find((tone) => tone.id === moodId) || tones[0] || null
      const activeVoice = voices.find((voice) => voice.voiceId === voiceId) || null
      const savedVoice = savedVoices.find((item) => item.voiceId === voiceId) || null
      const canDeleteVoice = Boolean(!presets.some((preset) => preset.voiceId === voiceId)
        && (savedVoice || (activeVoice && activeVoice.private)))
      const canRenameVoice = Boolean(voiceId)
        && !presets.some((preset) => preset.voiceId === voiceId)
        && !savedVoice

      const startRenameVoice = () => {
        if (!canRenameVoice) {
          setNotice(t('extra.renameBlocked'))
          return
        }
        setVoiceNameDraft((activeVoice && activeVoice.name) || '')
        setVoiceRenameOpen(true)
      }

      const renameVoice = async () => {
        const name = voiceNameDraft.trim()
        if (!name) {
          setNotice(t('extra.toneIncomplete'))
          return
        }
        setPhase('renameVoice')
        setNotice('')
        try {
          await api('/rename-voice', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ voiceId, name }),
          })
          setVoiceNames((prev) => ({ ...prev, [voiceId]: name }))
          setVoices((prev) => prev.map((voice) => (
            voice.voiceId === voiceId ? { ...voice, name } : voice
          )))
          setPhase('idle')
          setVoiceRenameOpen(false)
          setNotice(t('extra.voiceRenamed') + ' ' + name)
          const fresh = await api('/voices').catch(() => null)
          if (fresh && Array.isArray(fresh.voices)) {
            setVoices(fresh.voices.map((voice) => (
              voice.voiceId === voiceId ? { ...voice, name } : voice
            )))
          }
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const startNewTone = () => {
        setToneEditId('')
        setToneDraftName('')
        setToneDraftText('')
        setToneEditor(true)
      }

      const startEditTone = () => {
        if (!activeTone || activeTone.builtin) return
        setToneEditId(activeTone.id)
        setToneDraftName(activeTone.name)
        setToneDraftText(activeTone.instructions)
        setToneEditor(true)
      }

      const cancelTone = () => setToneEditor(false)

      const saveTone = async () => {
        const name = toneDraftName.trim()
        const text = toneDraftText.trim()
        if (!name || !text) {
          setNotice(t('extra.toneIncomplete'))
          return
        }
        setPhase('saveTone')
        setNotice('')
        const id = toneEditId || 'tone-' + Date.now().toString(36)
        const next = tones
          .filter((tone) => tone.builtin || tone.id !== id)
          .concat([{ id, name, instructions: text, builtin: false }])
        try {
          await api('/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ moodId: id, tones: next.filter((tone) => !tone.builtin) }),
          })
          setTones(next)
          setMoodId(id)
          setToneEditor(false)
          setPhase('idle')
          setNotice(t('extra.toneSaved'))
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const removeTone = async () => {
        if (!activeTone || activeTone.builtin) return
        setPhase('deleteTone')
        setNotice('')
        const next = tones.filter((tone) => tone.id !== activeTone.id)
        try {
          await api('/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ moodId: 'normal', tones: next.filter((tone) => !tone.builtin) }),
          })
          setTones(next)
          setMoodId('normal')
          setPhase('idle')
          setNotice(t('extra.toneDeleted'))
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const removeVoice = async () => {
        if (!canDeleteVoice) return
        setPhase('deleteVoice')
        setNotice('')
        try {
          await api('/delete-voice', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ voiceId }),
          })
          setPhase('idle')
          setNotice(savedVoice ? t('extra.voiceRemoved') : t('extra.voiceDeleted'))
          if (savedVoice) setSavedVoices(savedVoices.filter((item) => item.voiceId !== voiceId))
          setVoiceId(presets.length ? presets[0].voiceId : '')
          const fresh = await api('/voices').catch(() => null)
          if (fresh && Array.isArray(fresh.voices)) setVoices(fresh.voices)
        } catch (error) {
          setPhase('idle')
          setNotice(humanError(t, error))
        }
      }

      const row = (key, ...children) => h('div', { className: 'dsh-breeze-row', key },
        h('div', { className: 'dsh-breeze-key' }, key),
        h('div', { className: 'dsh-breeze-value' }, children))

      const sectionTitle = (key) => h('div', {
        key,
        style: { marginTop: 18, marginBottom: 4, fontSize: 13, fontWeight: 600, color: COLOR.primary },
      }, key)

      const optionLabel = (voice) => {
        const isPreset = presets.some((preset) => preset.voiceId === voice.voiceId)
        const label = (voiceNames[voice.voiceId] || voice.name)
        if (isPreset) return label + ' · ' + (voice.tag || '')
        return (voice.designed ? '★ ' : '') + label
      }

      return h('div', { style: { padding: '4px 0 12px' } },
        h(StyleSheet),
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 } },
          h('div', { style: { fontSize: 14, fontWeight: 600, color: COLOR.primary } }, t('section.title')),
          h('div', { style: { fontSize: 12, color: COLOR.secondary } }, t('section.subtitle'))),
        state.error ? h('p', { className: 'dsh-breeze-hint', style: { color: COLOR.error } }, state.error) : null,

        h('div', { style: { display: 'flex', flexDirection: 'column' } },
          row(t('extra.apiKey'),
            h('input', {
              className: 'dsh-breeze-control',
              style: { flex: 1, minWidth: 220, maxWidth: 360 },
              type: 'password',
              placeholder: data && data.hasKey ? t('extra.keyBound') : 'brz_...',
              value: apiKeyInput,
              onChange: (event) => setApiKeyInput(event.target.value),
            }),
            h('button', {
              type: 'button', className: 'dsh-breeze-btn', 'data-primary': 'true',
              onClick: connectKey, disabled: phase === 'connect',
            }, phase === 'connect' ? Spinner(12) : t('extra.connect')),
            data && data.hasKey
              ? h('button', {
                type: 'button', className: 'dsh-breeze-btn',
                onClick: disconnectKey, disabled: phase === 'disconnect',
              }, t('extra.disconnect'))
              : null,
            h('span', {
              style: {
                fontSize: 12,
                color: connectNote
                  ? (connectNote.tone === 'error' ? COLOR.error : connectNote.tone === 'ok' ? COLOR.success : COLOR.secondary)
                  : COLOR.secondary,
              },
            }, connectNote ? connectNote.text : (data && data.hasKey ? t('extra.keyBound') : t('extra.keyMissing')))),

          row(t('label.voice'),
            h('select', {
              className: 'dsh-breeze-control',
              style: { maxWidth: 340 },
              value: voiceId,
              onChange: (event) => setVoiceId(event.target.value),
            },
            presets.map((preset) => h('option', { key: preset.voiceId, value: preset.voiceId }, optionLabel(preset))),
            extra.filter((voice) => voice.private).map((voice) => h('option', { key: voice.voiceId, value: voice.voiceId }, optionLabel(voice))),
            savedVoices
              .filter((item) => !presets.some((preset) => preset.voiceId === item.voiceId))
              .map((item) => h('option', { key: item.voiceId, value: item.voiceId }, item.name)),
            voiceId && !presets.some((p) => p.voiceId === voiceId) && !extra.some((v) => v.voiceId === voiceId)
              ? h('option', { key: voiceId, value: voiceId }, voiceId)
              : null),
            h('button', {
              type: 'button',
              className: 'dsh-breeze-btn',
              onClick: startRenameVoice,
              disabled: !canRenameVoice || phase === 'renameVoice',
            }, t('extra.renameVoice')),
            h('button', {
              type: 'button',
              className: 'dsh-breeze-btn',
              onClick: removeVoice,
              disabled: !canDeleteVoice || phase === 'deleteVoice',
            }, phase === 'deleteVoice' ? Spinner(12) : t('extra.deleteVoice'))),

          voiceRenameOpen
            ? h('div', { style: { display: 'flex', gap: 8, margin: '2px 0 8px 144px' } },
              h('input', {
                className: 'dsh-breeze-control',
                style: { maxWidth: 260 },
                placeholder: t('extra.renamePlaceholder'),
                value: voiceNameDraft,
                onChange: (event) => setVoiceNameDraft(event.target.value),
              }),
              h('button', {
                type: 'button', className: 'dsh-breeze-btn', 'data-primary': 'true',
                onClick: renameVoice, disabled: phase === 'renameVoice',
              }, phase === 'renameVoice' ? Spinner(12) : t('extra.saveName')),
              h('button', { type: 'button', className: 'dsh-breeze-btn', onClick: () => setVoiceRenameOpen(false) }, t('extra.cancel')))
            : null,

          row(t('extra.publicVoices'),
            h('button', {
              type: 'button',
              className: 'dsh-breeze-btn',
              onClick: () => setLibraryOpen(!libraryOpen),
            }, libraryOpen ? t('extra.collapseLibrary') : t('extra.openLibrary')),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.publicVoicesHint'))),

          libraryOpen
            ? h('div', {
              style: {
                border: '1px solid ' + COLOR.border, borderRadius: 10, background: COLOR.surface,
                padding: 12, margin: '2px 0 10px',
              },
            },
            h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 } },
              h('div', { style: { fontSize: 13, fontWeight: 600, color: COLOR.primary } }, t('extra.libraryTitle')),
              h('div', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.librarySubtitle'))),
            h('input', {
              className: 'dsh-breeze-control',
              style: { width: '100%', marginBottom: 8 },
              placeholder: t('extra.librarySearch'),
              value: libraryQuery,
              onChange: (event) => setLibraryQuery(event.target.value),
            }),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' } },
              publicVoices.map((voice) => h('div', {
                key: voice.voiceId,
                style: {
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                  borderTop: '1px solid ' + COLOR.border,
                },
              },
              h('div', { style: { flex: 1, minWidth: 0 } },
                h('div', { style: { fontSize: 13, color: COLOR.primary } }, voice.name + ' · ' + (voice.language || '')),
                h('div', {
                  style: {
                    fontSize: 12, color: COLOR.secondary, lineHeight: '17px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  },
                }, voice.description || '')),
              h('button', {
                type: 'button', className: 'dsh-breeze-btn',
                onClick: () => audioPreview(voice.voiceId),
              }, t('label.preview')),
              h('button', {
                type: 'button',
                className: 'dsh-breeze-btn',
                'data-primary': savedVoices.some((item) => item.voiceId === voice.voiceId) ? 'false' : 'true',
                disabled: savedVoices.some((item) => item.voiceId === voice.voiceId),
                onClick: () => loadPublicVoice(voice),
              }, savedVoices.some((item) => item.voiceId === voice.voiceId) ? t('extra.voiceLoadedTag') : t('extra.loadVoice'))))),
            publicVoices.length ? null : h('div', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.libraryEmpty')))
            : null,

          row(t('label.mood'),
            h('select', {
              className: 'dsh-breeze-control',
              style: { maxWidth: 240 },
              value: moodId,
              onChange: (event) => setMoodId(event.target.value),
            },
            tones.map((tone) => h('option', { key: tone.id, value: tone.id },
              (tone.builtin ? t('tone.' + tone.id) : tone.name)
                + (tone.builtin ? '' : ' · ' + t('extra.customTag'))))),
            h('button', { type: 'button', className: 'dsh-breeze-btn', onClick: startNewTone }, t('extra.newTone')),
            activeTone && !activeTone.builtin
              ? h('button', { type: 'button', className: 'dsh-breeze-btn', onClick: startEditTone }, t('extra.editTone'))
              : null,
            activeTone && !activeTone.builtin
              ? h('button', { type: 'button', className: 'dsh-breeze-btn', onClick: removeTone, disabled: phase === 'deleteTone' }, t('extra.deleteTone'))
              : null),

          activeTone
            ? h('div', {
              style: {
                marginTop: -4, marginBottom: 6, fontSize: 12, lineHeight: '18px',
                color: COLOR.secondary, paddingLeft: 144,
              },
            }, activeTone.instructions)
            : null,

          toneEditor
            ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0 10px 144px' } },
              h('input', {
                className: 'dsh-breeze-control',
                style: { maxWidth: 300 },
                placeholder: t('extra.toneNamePlaceholder'),
                value: toneDraftName,
                onChange: (event) => setToneDraftName(event.target.value),
              }),
              h('textarea', {
                className: 'dsh-breeze-control',
                style: { minHeight: 62, padding: '8px 10px', resize: 'vertical', lineHeight: '20px' },
                placeholder: t('extra.tonePlaceholder'),
                maxLength: 500,
                value: toneDraftText,
                onChange: (event) => setToneDraftText(event.target.value),
              }),
              h('div', { style: { display: 'flex', gap: 8 } },
                h('button', {
                  type: 'button', className: 'dsh-breeze-btn', 'data-primary': 'true',
                  onClick: saveTone, disabled: phase === 'saveTone',
                }, phase === 'saveTone' ? Spinner(12) : t('extra.saveTone')),
                h('button', { type: 'button', className: 'dsh-breeze-btn', onClick: cancelTone }, t('extra.cancel'))))
            : null,

          row(t('extra.emotionMode'),
            h('select', {
              className: 'dsh-breeze-control',
              style: { maxWidth: 200 },
              value: emotionMode,
              onChange: async (event) => {
                const next = event.target.value
                setEmotionMode(next)
                try {
                  await api('/settings', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ emotionMode: next }),
                  })
                  setNotice(t('extra.emotionSaved'))
                } catch (error) {
                  setNotice(humanError(t, error))
                }
              },
            },
            h('option', { value: 'fixed' }, t('extra.emotionFixed')),
            h('option', { value: 'infer' }, t('extra.emotionInfer')),
            h('option', { value: 'marker' }, t('extra.emotionMarker'))),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } },
              emotionMode === 'infer'
                ? t('extra.emotionInferHint')
                : emotionMode === 'marker'
                  ? t('extra.emotionMarkerHint')
                  : t('extra.emotionFixedHint')),
            emotionMode === 'marker'
              ? h('div', { style: { flexBasis: '100%', fontSize: 12, color: COLOR.error, lineHeight: '18px' } }, t('extra.emotionMarkerNote'))
              : null),

          row(t('label.previewText'),
            h('input', {
              className: 'dsh-breeze-control',
              style: { flex: 1, minWidth: 220, maxWidth: 420 },
              value: previewText,
              onChange: (event) => setPreviewText(event.target.value),
            }),
            h('button', {
              type: 'button',
              className: 'dsh-breeze-play',
              onClick: preview,
              disabled: phase === 'preview',
            }, phase === 'preview' ? Spinner(11) : PlayGlyph(11), h('span', null, t('label.preview')))),

          row(t('extra.autoSpeak'),
            h('button', {
              type: 'button',
              role: 'switch',
              'aria-checked': autoSpeak ? 'true' : 'false',
              className: 'dsh-breeze-switch',
              'data-on': autoSpeak ? 'true' : 'false',
              onClick: () => setAutoSpeak(!autoSpeak),
            }, h('span', { className: 'dsh-breeze-knob' })),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.autoSpeakHint'))),

          row(t('extra.backgroundPlay'),
            h('button', {
              type: 'button',
              role: 'switch',
              'aria-checked': backgroundPlay ? 'true' : 'false',
              className: 'dsh-breeze-switch',
              'data-on': backgroundPlay ? 'true' : 'false',
              onClick: () => setBackgroundPlay(!backgroundPlay),
            }, h('span', { className: 'dsh-breeze-knob' })),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.backgroundPlayHint'))),

          row(t('extra.autoMax'),
            h('input', {
              type: 'range', min: 0, max: 1000, step: 10,
              value: Math.min(1000, Math.max(0, Number(autoMax) || 0)),
              onChange: (event) => setAutoMax(Number(event.target.value)),
              style: { flex: 1, minWidth: 160, maxWidth: 320, accentColor: COLOR.brand },
            }),
            h('input', {
              className: 'dsh-breeze-control',
              style: { width: 96 },
              type: 'number', min: 0, max: 99999, step: 1,
              value: autoMax,
              onChange: (event) => setAutoMax(Math.max(0, Math.min(99999, Number(event.target.value) || 0))),
            }),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('status.chars')),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.autoMaxHint')),
            autoMax > 1000
              ? h('div', { style: { flexBasis: '100%', fontSize: 12, fontWeight: 600, color: COLOR.error, lineHeight: '18px' } }, t('extra.autoMaxHard'))
              : autoMax > 300
                ? h('div', { style: { flexBasis: '100%', fontSize: 12, color: COLOR.error, lineHeight: '18px' } }, t('extra.autoMaxWarning'))
                : null),

          row(t('label.dailyLimit'),
            h('input', {
              className: 'dsh-breeze-control',
              style: { width: 110 },
              type: 'number', min: 100, step: 100,
              value: dailyChars,
              onChange: (event) => setDailyChars(event.target.value),
            }),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('hint.limit'))),

          row(t('label.todayUsage'),
            h('span', { style: { fontSize: 13, color: COLOR.primary } }, used + ' / ' + limit + ' ' + t('status.chars')),
            h('span', {
              style: {
                flex: '1 1 120px', maxWidth: 220, height: 5, borderRadius: 999,
                background: COLOR.border, overflow: 'hidden', display: 'block',
              },
            }, h('span', {
              style: {
                display: 'block', height: '100%', borderRadius: 999,
                width: Math.min(100, limit ? Math.round((used / limit) * 100) : 0) + '%',
                background: COLOR.brand,
              },
            }))),

          row(t('label.balance'),
            h('span', { style: { fontSize: 13, color: COLOR.primary } }, balance === null ? '-' : balance.toFixed(1)),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('status.credits')),
            h('button', {
              type: 'button',
              className: 'dsh-breeze-btn',
              onClick: doRefresh,
              disabled: phase === 'refresh',
            }, phase === 'refresh' ? Spinner(12) : t('label.refresh')),
            refreshNote.text
              ? h('span', {
                style: {
                  fontSize: 12,
                  color: refreshNote.tone === 'error' ? COLOR.error : refreshNote.tone === 'ok' ? COLOR.success : COLOR.secondary,
                },
              }, refreshNote.text)
              : null)),

        h('div', {
          style: { marginTop: 14, fontSize: 12, lineHeight: '18px', color: COLOR.secondary },
        }, t('extra.cloneNotice')),

        h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 } },
          h('button', {
            type: 'button', className: 'dsh-breeze-btn', 'data-primary': 'true',
            onClick: save, disabled: phase === 'save',
          }, phase === 'save' ? t('label.saving') : t('label.save')),
          notice ? h('span', { style: { fontSize: 12, color: COLOR.secondary } }, notice) : null),
        data && data.ok === false ? h('p', { className: 'dsh-breeze-hint' }, t('hint.key')) : null,

        sectionTitle(t('extra.designTitle')),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 } },
          h('textarea', {
            className: 'dsh-breeze-control',
            style: { minHeight: 88, padding: '8px 10px', resize: 'vertical', lineHeight: '20px' },
            placeholder: t('extra.designPlaceholder'),
            maxLength: 500,
            value: designDesc,
            onChange: (event) => setDesignDesc(event.target.value),
          }),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
            h('input', {
              className: 'dsh-breeze-control',
              style: { flex: 1, minWidth: 200, maxWidth: 420 },
              placeholder: t('extra.designSample'),
              maxLength: 500,
              value: designText,
              onChange: (event) => setDesignText(event.target.value),
            }),
            h('input', {
              className: 'dsh-breeze-control',
              style: { width: 160 },
              placeholder: t('extra.voiceNamePlaceholder'),
              value: designName,
              onChange: (event) => setDesignName(event.target.value),
            }),
            h('button', {
              type: 'button', className: 'dsh-breeze-btn', 'data-primary': 'true',
              onClick: generate, disabled: phase === 'design' || designDesc.trim().length < 3,
            }, phase === 'design' ? t('extra.generating') : t('extra.generate')),
            h('span', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.designCost'))),
          h('p', { className: 'dsh-breeze-hint', style: { margin: 0 } }, t('extra.designHint')),
          candidates.length
            ? h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 } },
              candidates.map((candidate, index) => h('div', {
                key: candidate.generatedVoiceId,
                style: {
                  border: '1px solid ' + COLOR.border, borderRadius: 10, padding: 10,
                  background: COLOR.nested, minWidth: 150, display: 'flex',
                  flexDirection: 'column', gap: 8,
                },
              },
              h('div', { style: { fontSize: 12, color: COLOR.secondary } }, t('extra.candidate') + ' ' + (index + 1)),
              h('div', { style: { display: 'flex', gap: 8 } },
                h('button', {
                  type: 'button', className: 'dsh-breeze-btn',
                  onClick: () => playUrl(candidate.url).catch(() => {}),
                }, PlayGlyph(10), t('label.preview')),
                h('button', {
                  type: 'button', className: 'dsh-breeze-btn', 'data-primary': 'true',
                  onClick: () => saveCandidate(candidate),
                  disabled: phase === 'saveVoice',
                }, t('extra.saveVoice'))))))
            : null))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        let t = (key) => lookup(DICT.zh, key)
        try {
          ctx.effect(() => ctx.locale.register(NS, FLAT), 'dsh-breeze-tts: dictionaries')
          const bound = ctx.locale.bind(NS)
          if (typeof bound === 'function') {
            t = (key) => {
              let value
              try {
                value = bound(key)
              } catch {
                value = undefined
              }
              if (typeof value === 'string' && value && value !== key) return value
              const flat = FLAT.zh[key]
              return typeof flat === 'string' ? flat : lookup(DICT.zh, key)
            }
          }
        } catch {
          t = (key) => lookup(DICT.zh, key)
        }

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'breeze-tts',
          order: 60,
          locale: NS,
          label: () => t('section.title'),
        }, (props) => h(SettingsPage, Object.assign({}, props, { t }))))

        ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
          name: 'conversation.chat.assistant-actions',
          id: 'breeze-tts-speak',
          order: 30,
          locale: NS,
        }, (props) => h(SpeakButton, Object.assign({}, props, { t }))))

        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'breeze-tts-status',
          order: 30,
          locale: NS,
        }, (props) => h(AutoSpeakChip, Object.assign({}, props, { t }))))
      },
    }
  },
})
