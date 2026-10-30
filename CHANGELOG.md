# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

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
