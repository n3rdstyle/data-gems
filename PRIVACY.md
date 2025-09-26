# Privacy Policy - Data Gems

**Last Updated: September 26, 2025**
**Version: 1.1.0**

## Overview

Data Gems - Personal Context Provider ("Data Gems", "the Extension", "we", "our") is committed to protecting your privacy. This privacy policy explains how Data Gems handles your personal information.

## Core Privacy Principle

**Your data never leaves your device.** Data Gems is designed as a local-only application with zero data collection and zero data transmission to external servers.

## Data Collection and Storage

### What We Store
- **Personal profile information**: Only data you explicitly enter into the extension
- **User preferences**: Settings and configuration choices you make
- **Usage patterns**: Local preferences for profile injection and interface customization
- **Quiz responses**: Your answers to the Quiz of Gems feature for profile enrichment
- **Prompt library**: Custom prompts and commands you create for quick access
- **Subprofiles**: Different context configurations for various use cases

### Where We Store It
- **100% Local Storage**: All data is stored locally on your device using Chrome's storage API
- **No Cloud Storage**: We do not use any external servers, databases, or cloud storage services
- **No Account Required**: No sign-up, login, or account creation required

### What We Don't Collect
- ❌ Personal identifying information beyond what you choose to enter
- ❌ Browsing history or website activity
- ❌ Analytics or usage tracking data
- ❌ Location information
- ❌ Device information beyond what's necessary for functionality
- ❌ Any data about your AI conversations

## Data Usage

### How Your Data Is Used
- **Profile Injection**: Your personal information is inserted into AI chat interfaces only when you explicitly click the injection button
- **Personalization**: Your preferences are used to customize the extension interface
- **Export/Import**: Your data can be exported for backup purposes and imported to restore profiles

### Data Sharing
- **We share ZERO data** with third parties, advertisers, or analytics services
- **No data transmission** occurs to our servers or any external services
- **AI platforms** only receive the profile information you choose to inject, and this happens directly from your browser to the AI service

## Browser Permissions

Data Gems requests the following permissions for functionality:

### Required Permissions
- **storage**: Store your profile data locally on your device
- **scripting**: Inject the profile button into AI chat interfaces
- **activeTab**: Access the current tab to insert profile data when you click inject
- **contextMenus**: Provide right-click menu options
- **tabs**: Access tab information for quiz feature functionality
- **commands**: Enable keyboard shortcuts

### Host Permissions
Access to specific AI platform domains to inject functionality:
- chatgpt.com, chat.openai.com
- claude.ai  
- gemini.google.com
- perplexity.ai

**Important**: These permissions are used solely for core functionality. No data monitoring, collection, or transmission occurs.

### New in v1.1.0
- **tabs permission**: Required for the Quiz of Gems feature to open in a new tab. This permission does NOT allow us to see your browsing history or monitor your activity - it only allows the extension to open and communicate with the quiz page.
- **web_accessible_resources**: The quiz.html page is made accessible as a web resource to enable the interactive quiz feature.

## Data Security

### Local Security
- Data is encrypted using Chrome's built-in storage security
- No passwords or authentication credentials are stored
- Export files can be encrypted with a user-provided passphrase

### No External Vulnerabilities
- No external API connections means no risk of data breaches from our servers
- No third-party integrations means no additional privacy risks
- Complete offline functionality eliminates network-based security concerns

## User Control

You have complete control over your data:

- **Add/Edit/Delete**: Modify any profile information at any time
- **Export**: Create encrypted backups of your profile data including prompt library
- **Import**: Restore profiles and prompts from backup files
- **Clear All**: Completely remove all stored data from the extension
- **Granular Control**: Choose which parts of your profile to inject per conversation
- **Subprofile Management**: Create and switch between different context profiles
- **Quiz Control**: Take or skip the interactive quiz to build your profile

## Third-Party Interactions

### AI Platforms
When you choose to inject your profile:
- Data is sent directly from your browser to the AI platform
- We do not intercept, store, or monitor this transmission
- The AI platform's privacy policy governs how they handle injected data
- You control exactly what information gets shared

### No Other Third Parties
- No analytics services (Google Analytics, etc.)
- No advertising networks
- No social media integrations
- No external APIs or web services

## Data Retention

- **Local Storage**: Data persists until you manually delete it or uninstall the extension
- **Uninstall**: All data is automatically removed when you uninstall Data Gems
- **No Server-Side Retention**: We have no servers, so no data is retained externally

## Children's Privacy

Data Gems does not knowingly collect personal information from children under 13. Since all data is stored locally and no accounts are created, we have no way to determine user age. Parents should monitor their children's browser extension usage.

## Changes to Privacy Policy

- Privacy policy updates will be posted to this GitHub repository
- Material changes will be highlighted in release notes
- Continued use after policy updates constitutes acceptance of changes

## Open Source Transparency

Data Gems is open source, allowing you to:
- Review the entire codebase for privacy compliance
- Verify that no data collection or transmission occurs
- Contribute to privacy improvements
- Build and run your own version if desired

**GitHub Repository**: https://github.com/n3rdstyle/data-gems

## Contact Information

For privacy questions or concerns:
- **GitHub Issues**: https://github.com/n3rdstyle/data-gems/issues
- **Email**: [Contact email to be provided]

## Compliance

This privacy policy is designed to comply with:
- Chrome Web Store Privacy Requirements
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Other applicable privacy regulations

## Summary

**Data Gems prioritizes your privacy above all else. Your personal information stays on your device, under your complete control, with zero external data transmission or collection.**