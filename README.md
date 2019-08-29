![logo](https://github.com/bucko13/prism/blob/master/src/images/logo.png 'logo')

# The Prism Reader

The Prism Reader is an application powered by Blockstack, Lightning, and Bitcoin. Try it live on testnet!
[https://prismreader.app](https://prismreader.app).

## Usage

These are brief instructions on how to interact with a running instance of Prism. Scroll down
for instructions on how to run your own instance of Prism.

#### Logging in

Logging in is relatively simple. All you need is a [blockstack id](https://blockstack.org) which
can be created easily via the [Blockstack Browser](https://browser.blockstack.org/).

#### Accepting Payments

**A.K.A. How to manage your own paywall**

In order to directly receive payments for people that view your content, you need to setup a lambda service
using [Now by Zeit](https://zeit.co/now), which can be setup for free, and setup a developer account
(only testnet is supported for now) with [OpenNode](https://opennode.co) for interacting with lightning.
With that, you can spin up and deploy an instance of [boltwall](https://github.com/tierion/now-boltwall)
for receiving payments. Full instructions available on the [now-boltwall repo](https://github.com/tierion/now-boltwall).

## What it does

Prism uses new technology enabled by the advent of the blockchain to disaggregate the services that are typically provided by a single, centralized service.

1. **Users**- Accounts are stored on Blockstack, which means that a user always retains ownership of their online identity.

2. **Storage**- Storage is managed using Blockstack's own
   [Radiks](https://github.com/blockstack-radiks/radiks) and
   [Gaia](https://docs.blockstack.org/storage/overview.html) storage systems.
   This means that when a user uploads content, they are in complete control of that
   content. If Prism goes away, or decides to remove a user from the platform, that user
   can move somewhere else, retaining ownership of the content and distribution rights.

3. **Lightning and Bitcoin payments**- Not only do you control your account and your
   content, but you also keep control of the paywall. Rather than relying on a third
   party to manage payouts for you, as
   [Medium has now started to do](https://blog.medium.com/how-mediums-curation-distribution-and-paywall-systems-work-for-writers-f74994ce9ed9), you set the payment gateway when you upload a document. **This makes your paywall as portable and uncensorable as your content**. Any user can then browse available posts uploaded by other users, but they can only view the content after paying a lightning invoice for a designated amount of time. When they see a post they like, they click on it, choose how much time they would like to read for and then are given an invoice. Once the invoice has been paid, they are authenticated to be able read that document until time runs out.

4. **Intellectual Property Protection**- How do you protect intellectual property in a
   decentralized world? While enforcement is difficult, if not impossible, without some
   centralized service (i.e. an oracle), we can enable proof of provenance using the
   Bitcoin blockchain. With [Chainpoint](https://chainpoint.org) whenever a new post has
   been uploaded to Gaia, a sha256 hash is created from that post and submitted to the
   Chainpoint network. Within 1-2 hours, this hash is anchored to the Bitcoin blockchain.
   If the owner of the post reloads their profile page after this time, then a proof is
   retrieved from the Chainpoint network and then saved in Gaia. Prism is able to
   retrieve these proofs as they are not encrypted and any user can then know beyond any
   reasonable doubt the earliest that that version of the post they are viewing was
   published. A later upgrade should enable the downloading of these proofs so that
   anyone can easily and independently verify the proof outside of the app.

## Protecting Content Without Compromising Decentralization

One challenge when building a system where each user controls their own content, only
revealing it when they want to (i.e. when they've received a payment), is **how to
create a framework where the content owner grants permission to a third party to share
content, without making it available to everyone**, but still retaining ultimate
ownership. Radiks (and therefore by extension Gaia) allows a client to choose whether
or not to encrypt content stored in their Gaia service. However, if it is encrypted,
then no one else can view it except the owner. If it is decrypted, then anyone can
view the content regardless of whether they paid or not as long as they have access to
the Gaia network.

We solved this problem using a combination of symmetric and asymmetric key encryption.

#### Symmetric Key Encryption

The first step was to have a shared key that both the app and the content owner know.
This key is then used to encrypt the post content before saving it to Gaia. A
reference to this key is then saved on the document model as well as the user,
allowing the app to look up the key whenever they want to decrypt the post. When the
app receives an authenticated request (i.e. invoice has been paid) to view the
content, they look up the encryption key, use that to decrypt the content and then
send the decrypted content to the authenticated client.

#### Asymmetric Key Encryption

There is, of course, one obvious problem with this. If the app can look up the user's
encryption key, then that means anyone else can look up the key as well. For this, we
added one more level of encryption. Before uploading the encrypted post, the user will
go through two steps: 1) the key is stored in an encrypted state such that only that
authenticated user can look up the unencrypted key and decrypt the content with it. 2)
the key is stored in Radiks with the `decrypted` option set to `true`, however, before
saving it, we encrypt it using the App's _Public Key_. This means that while anyone
can see this key on Gaia, most importantly the App that needs to decrypt content with
the key, only the App, who has the associated private key, can decrypt it to retrieve
the encryption key needed in the previous step.

#### Key Revocation a.k.a. How Prism Can't Be Evil

In other words, how to revoke permission to share content from the app.

In order to stay true to our goal of decentralization, we need a way for a user to
keep in control of their content and hold the platform accountable if they violate the
trust of the user. This too is relatively easy. All the user has to do is:

1. Update the post content, encrypting with a new key
2. Replace the previous encryption key with the new key
3. Don't keep a version of the key that is encrypted with the app's public key.

Now if the app tries to share, copy, or in any way retrieve the content, they will
only get a garbled mess of encrypted data.

What's even more powerful in this system is that since payment also isn't managed by
the app, the platform is further incentivized to prioritize the needs of the user as _
it has even less leverage to control content creators_. A competitor could easily
clone the project and create their own hosting platform where all content on the
"evil" platform would immediately be accessible from the cloned one and users can
migrate away from the evil platform by simply re-keying using the new platform's
public key.

## Installation

Follow these instructions if you would like to run your own instance of Prism.
You will need to save up to 6 environment secrets during the setup process needed for deployment:

- `SESSION_SECRET`- for signing authentication macaroons
- `MONGODB_URI`- connection string for connecting to a mongodb deployment
- `APP_PRIVATE_KEY`- a private key used to decrypt content encrypted w/ a corresponding public key
- `BOLTWALL_URI` - a uri where you are running a payment gateway. Useful to have a fallback
  for paywalled content without its own payment gateway
- `CAVEAT_KEY` - this is a shared key between Prism and the payment gateway deployed
  at the `BOLTWALL_URI` above used for 3rd party authentication
- `OPEN_NODE_KEY`- This isn't strictly necessary, but is used for utility endpoints,
  such as getting exchange rates for display

#### Zeit and Mongodb

1. Setup an account with [Zeit](https://zeit.co/now) and install the cli/Desktop tool locally
2. Follow the instructions in Step 1 for how to
   [setup a Mongodb service with Now](https://zeit.co/guides/deploying-a-mongodb-powered-api-with-node-and-now/),
   specifically setting up a remote MongoDB service that your app can interact with
   (this is for the radiks service)
3. Take note of your mongodb connection string, you will need to save that as an environment variable

#### Blockstack

Prism is able to selectively decrypt content uploaded by a user through a key sharing
scheme that leverages the blockstack id system. An account probably isn't strictly necessary,
but it makes the system more predictable and easier to manage

4. [Sign up for blockstack](https://browser.blockstack.org) and/or create an account to
   be associated with your app
5. Install the blockstack cli and use the
   [get_app_keys](https://docs.blockstack.org/develop/clidocs#get_app_keys) to get the private key
   for the user associated with this app. (this is just one way to get your app private key. Any way is fine)
6. Save the APP_PRIVATE_KEY for later

#### Session keys and LN Builder

7. Generate a session key (using a crypto library for a 256 bit random number should work and is secure).
8. Deploy a [boltwall service](https://github.com/tierion/now-boltwall) to run
   as a backup payment gateway.
9. Take note of the session key, uri of the ln builder service, and caveat key
   you came up with for the ln builder.

#### Open Node (optional)

This is used in the app only for utilities like getting exchange rate

10. Create a developer account on open node
11. Create and save an API key

#### Install and Deploy Prism w/ Now

12. Clone this repo to your local machine
13. In the project repo, save the API keys as secrets with now.
    Replace everything in brackets `[ ]` with your own corresponding key. This makes the environment variables available
    during build and deployment.

```bash
$ now secrets add session-secret "[SESSION_SECRET]"
$ now secrets add open-node-key "[OPEN_NODE_KEY]"
$ now secrets add app-private-key "[APP_PRIVATE_KEY]"
$ now secrets add my-mongodb-uri "[MONGODB_URI]"
$ now secrets add ln-uri "[ln-uri]"
```

14. You're ready to deploy! simply run `now` in your project repo, and Now will take
    care of the rest, returning the live URI when it's done.

15. For local development, add the secrets to an `.env` and `.env.build` file in your
    project (they won't be saved by git), run `yarn` in both the main directory
    and the `api` directory, and then run `now dev` in the main project directory.

NOTE: This is a fork of the [Lightning Reader project](https://github.com/bucko13/lightning-reader),
building on top of the work originally done there,
while changing some of the functionality for more flexibility and user control.
