# Flaming Zipper

## Prerequisites

- git
- fvm
- nvm

## Create this project

https://github.com/MichinobuMaeda?tab=repositories

- New
    - Repository name: flamingzipper

https://console.firebase.google.com/

- Add project
    - Project name: flamingzipper
    - Configure Google Analytics
        - Create new account: flamingzipper
        - Analytics location: Japan
- Project Overview
    - Project settings
        - Default GCP resource location: asia-northeast2 ( Osaka )
        - Environment type: Production
        - Public-facing name: Flaming Zipper
    - Details & settings
        - Usage and billing
            - Modify plan: Blaze
    - Your apps
        - </> ( Web )
            - App nickname: Flaming Zipper
- Build
    - Authentication
        - Get started
            - Email/Password: Enable
                - Email link (passwordless sign-in): Enable
    - Firestore database
        - Create database
            - Start in production mode

```
$ fvm flutter create -t app --platforms web flamingzipper
$ cd flamingzipper
$ fvm use 3.0.5
$ echo 16 > .nvmrc
$ nvm use
$ git init
$ git add .
$ git commit -m "first commit"
$ git branch -M main
$ git remote add origin git@github.com:MichinobuMaeda/flamingzipper.git
$ git push -u origin main
$ npm init
$ npm install firebase-tools -D
$ npx firebase login
$ npx firebase init
? Which Firebase features do you want to set up for this directory?
 Firestore: Configure security rules and indexes files for Firestore,
 Functions: Configure a Cloud Functions directory and its files,
 Hosting: Configure files for Firebase Hosting,
 Hosting: Set up GitHub Action deploys,
 Storage: Configure a security rules file for Cloud Storage,
 Emulators: Set up local emulators for Firebase products

=== Project Setup

? Please select an option: Use an existing project
? Select a default Firebase project for this directory: flamingzipper (flamingzipper)

=== Firestore Setup

? What file should be used for Firestore Rules? firestore.rules
? What file should be used for Firestore indexes? firestore.indexes.json

=== Functions Setup

? What language would you like to use to write Cloud Functions? JavaScript
? Do you want to use ESLint to catch probable bugs and enforce style? No
? Do you want to install dependencies with npm now? Yes

=== Hosting Setup

? What do you want to use as your public directory? build/web
? Configure as a single-page app (rewrite all urls to /index.html)? No
? Set up automatic builds and deploys with GitHub? Yes
? For which GitHub repository would you like to set up a GitHub workflow? (format: user/repository) MichinobuMaeda/flamingzipper
? Set up the workflow to run a build script before every deploy? Yes
? What script should be run before every deploy? npm ci && npm run build
? Set up automatic deployment to your site's live channel when a PR is merged? Yes
? What is the name of the GitHub branch associated with your site's live channel? main
i  Action required: Visit this URL to revoke authorization for the Firebase CLI GitHub OAuth App:
https://github.com/settings/connections/applications/89cf50f02ac6aaed3484

=== Storage Setup

? What file should be used for Storage Rules? storage.rules

=== Emulators Setup
? Which Firebase emulators do you want to set up? Press Space to select emulators, then Enter to confirm your c
hoices. Authentication Emulator, Functions Emulator, Firestore Emulator, Storage Emulator
? Which port do you want to use for the auth emulator? 9099
? Which port do you want to use for the functions emulator? 5001
? Which port do you want to use for the firestore emulator? 8080
? Which port do you want to use for the storage emulator? 9199
? Would you like to enable the Emulator UI? Yes
? Which port do you want to use for the Emulator UI (leave empty to use any available port)? 4040
? Would you like to download the emulators now? No

$ npx firebase functions:config:set initial.email=*******
$ npx firebase functions:config:set initial.password=*******
$ npx firebase functions:config:set initial.url=https://flamingzipper.web.app/
$ npx firebase deploy --only functions
````
