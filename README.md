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
$ git commit -m "first commit"
````
