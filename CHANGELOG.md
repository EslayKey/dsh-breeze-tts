# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Changed
- Model-tagged replies use emoji Markdown markers in DSH. Both the new markup and legacy HTML comments are recognized for speech.
- The settings page shows connection management on demand and keeps voice, tone, and preview controls together.

### Fixed
- The chat quota indicator refreshes after speech synthesis and picks up tool usage without restarting DSH or querying the Breeze account balance.
- Refreshing the balance and today's usage preserves unsaved settings. The save control stays visible and reports pending changes.

## [1.0.6] - 2026-11-15

### Changed
- One normalised segment plan now drives requests, daily budget and the cache key, so all three can no longer disagree
- Auto-speak waits for the harness turn-end signal (`legacy.turnEnds`); when that signal is missing it stays silent and leaves reading to the manual button

### Fixed
- A single leading emotion marker stayed in the spoken text
- Sentences longer than the API limit were sent whole; they are now split without breaking Unicode
- Mixed Chinese/English text was synthesised as one request with one language
- Partial failures left already-synthesised segments unaccounted
- Concurrent requests for the same text called the API twice; synthesis now runs at most two calls in parallel

### Fixed (quota and language)
- Synthesis now runs one call at a time, so two concurrent requests can no longer both pass the daily check; the settings file also has a single write lock
- `languageMode: 'en'|'zh'` works again (a non-auto mode is the language itself); the language actually sent is what the cache key and the budget use

### Fixed (auto-speak lifecycle)
- The play call is checked against its generation and pending instance after it resolves, so a session switch can no longer write the old reply into the new session's state
- The synthesis/play request is never replayed after it was sent (a retry could charge and speak twice); such a failure is recorded as skipped and left to the manual button, while the read-only `/status` keeps a bounded retry
- A `/status` already in flight is abandoned when the same session starts a new stream, the signal disappears or the candidate is replaced; only identical re-renders keep waiting
- A message is marked spoken only after playback succeeds, so a failed `/status` or play is retried with backoff (three attempts) instead of being recorded
- Replies skipped by settings (auto-speak off, over the limit, background) are recorded as skipped and never replayed later

### Fixed (auto-speak completion)
- Speech now requires the recorded turn end reason to be `completed`; error, aborted, interrupted and unknown endings never speak
- A pending 400 ms timer is cancelled on every render and on session switch, and a late `/status` reply is discarded, so the previous session can no longer be spoken
- The played-message table follows the active session

### Fixed (tool surface)
- `tts_speak` ignored its public `mood` argument; it now maps to the matching tone and its instructions
- `play:true` with a `.mp3` save path synthesised WAV and handed it to the player; it is now refused before any request

### Added
- `plan.js` with offline tests: `plan`, `concurrency`, `tool`, `autospeak`, `autospeak-timer`, `autospeak-integration`, `tts_speak` (50 checks)


## [1.0.5] - 2026-10-31

### Fixed
- After a client remount (or a fresh session) the "already spoken" marker could prime on an empty message list, so the previous reply was spoken again
- Auto-speak now reads only the message's own text blocks instead of the broad fallback walk, which could pick up unrelated text
- Added a one-line diagnostic to ~/.dsh/breeze-tts/autospeak.log recording what was spoken


## [1.0.4] - 2026-10-31

### Fixed
- Emotion tags were mangled by the text cleaner before synthesis, so auto-speak spoke the tag fragments instead of applying them
- A 260 ms breath is now inserted between synthesized segments, so tone changes no longer sound clipped together


## [1.0.3] - 2026-10-31

### Fixed
- Auto-speak dropped emotion tags before synthesis, so tagged replies lost their per-segment tone; the per-message button was unaffected because it used a different text path
- Auto-speak could fire while the reply was still being generated; it now waits until the text has been stable for a few seconds


## [1.0.1] - 2026-10-30

### Added
- API key binding directly in the settings page: paste a key, validate it against the account balance, and disconnect when needed
- Built-in tone names are localized (English UI shows Natural / Warm / Formal / Lively)

### Fixed
- Emotion tags were counted against the auto-speak character limit and could be spoken aloud


## [1.0.0] - 2026-10-30

### Added
- Three agent tools: `tts_speak`, `tts_voices`, `tts_status`
- Settings page: voice, delivery preset, preview line, daily character limit, balance, usage bar
- One-click "read this reply" action on every finalized assistant message
- Auto-speak for replies within a configurable character limit (off by default)
- Voice design: generate three candidates from a text description, audition and save
- Sentence-level language detection so mixed Chinese/English text keeps the right accent
- Six built-in public voices across gender, age and accent
- Localized error messages with an API code map (auth, rate limit, credits, validation, daily quota)
