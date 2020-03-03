![logo](https://github.com/bucko13/prism/blob/master/src/images/logo.png 'logo')

# The Prism Reader

The Prism Reader is an application powered by Blockstack, Lightning, and Bitcoin. Try it live on testnet!
[https://prismreader.app](https://prismreader.app).

Demo video [here](https://youtu.be/SqeV3FZ9vUM).

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

## What Makes This Projects Different? 
- **Distributed Storage** - Content is stored w/ Gaia and Radiks by Blockstack rather than on a centralized platform
- **Self-Sovereign Paywalls** - Creators get paid _directly_ for their data, authorized through Boltwall
- **Timed Access** - Using the power of micro-payments w/ lightning, the flexibility of Boltwall, and the versatility of macaroons for authentication, users only have to pay for what they use as a result of Prism and Boltwall's support for _timed authorization_
- **Split Payments** - By leveraging support for [HODL Invoices](https://github.com/lightningnetwork/lnd/pull/2022) in lnd and Boltwall, the platform, Prism, can also get paid a fee for their service. The user only has to pay one invoice, but two lightning nodes get paid, all trustlessly verifiable. In Prism, this is used in our tipping system. 
- **Blockchain Notary** - using timestamps w/  [Chainpoint](https://chainpoint.org) on the Bitcoin blockchain, authors can trustlessly prove the authenticity of their content by having it pegged to a specific block.

In the section below about **challenges**, we go into detail about the specific technical aspects of this project that make the above possible. 

## A Unique Business Model
It still remains incredibly difficult to find a viable business model that "Can't Be Evil", giving users full control over their money, data, and content while still retaining the mechanisms to make money. This is particularly difficult in the area of social media and content sharing. Nearly all proposals currently either rest on the "Utility Token Model", altruism, or a "Fake it 'til you make it" approach, where the "make it" part is never really well articulated.

There are examples of escrow-like systems that leverage smart contracting capabilities, but most of these use on-chain payments, which are expensive and hard to scale. 

Other projects out there act as short term custodians of funds, offering regular payouts upon the submission of a lightning invoice, for example. This, of course, isn't possible in a system with self-sovereign paywalls where you don't want to rely on someone else to give payouts and track how much you're owed.

#### Another Way
The model of split payments introduced in Prism and Boltwall means that the service (Prism in this case) can charge a fee when payments are made by the user in exchange for facilitating the transfer and providing the platform to view the content. Furthermore, the user _and_ the actual owner of the data can ensure that Prism only receives a payment if the user gets what they want and the owner gets paid their share. If either of these agreements is broken, the user receives a refund. 

This mechanism is implemented in "tipping" for posts on Prism, giving thumbs up or down where both require payment (to disincentivize trolls) which gets split between Prism and the owner of the content getting tipped. **This type of split payment without any custodianship by an intermediary would be impossible without Lightning.**

## Major Challenges
There were three main innovations that we believe this project has helped to introduce, with each of the three being explained in further detail below:

**1. Selective revealing of content**- How do we let a platform that is not the owner of content still have the ability to share content owned by another Blockstack user? Further, how do we only let the platform access this content without exposing it to everyone else that can read Gaia entries? 

**2. 1 Invoice, 2 Payments** - How can we make the process of paying the platform and the content owner as painless, invisible, and trustless as possible for the user?

**3. A Paywall for every user** - How can we avoid being a custodian of funds at any point without access to a user's node? How can we support 3rd parties giving authorization on our platform? 

### Symmetrical Encryption for Selective Revealing of Content
Radiks (and therefore by extension Gaia) allows a client to choose whether or not to encrypt content stored in their public Gaia service. However, if it is encrypted, then no one else can view it except the owner. On the other hand, if it is decrypted, then anyone can view the content regardless of whether they paid or not as long as they have access to the Gaia network. 

We solved this problem using a combination of symmetric and asymmetric key encryption. 

#### Symmetric Key Encryption
The first step was to have a shared key that both the app and the content owner know. This key is then used to encrypt the post content before saving it to Gaia. A reference to this key is then saved on the document model as well as the user model, allowing the app to look up the key whenever they want to decrypt the post without having to ask the user. When the app receives an authenticated request (i.e. an invoice has been paid) to view the content, they look up the encryption key, use that to decrypt the content and then send the decrypted content to the authenticated client.

#### Asymmetric Key Encryption
There is, of course, one obvious problem with this. If the app can look up the user's encryption key, then that means anyone else can look up the key as well. For this, we added one more level of encryption. Before uploading the encrypted post, the user will go through two steps: 

1. the key is stored in an encrypted state such that only that authenticated user can look up the unencrypted key and decrypt the content with it. 

2. the key is stored in Radiks with the `decrypted` option set to `true`, but before saving it, we encrypt it using the _App's public key_. 

This means that while anyone can see this key on Gaia, most importantly the App that needs to decrypt content with the key, only the App, who has the associated private key, can decrypt it to retrieve the encryption key needed in the previous step.

#### Key Revocation a.k.a. How We Can't Be Evil
In other words, how to revoke permission to share content from the app.

In order to stay true to our goal of decentralization, we need a way for a user to keep in control of their content and hold the platform accountable if they violate the trust of the user. This too is relatively easy using Gaia and Blockstack. All the user has to do is:

1. Update the post content, encrypting with a new key
2. Replace the previous encryption key with the new key
3. Don't keep a version of the key that is encrypted with the app's public key. 

Now if the app tries to share, copy, or in any way retrieve the content, they will only get a garbled mess of encrypted data. 

What's even more powerful in this system is that since payment also isn't managed by the app, the platform is further incentivized to prioritize the needs of the user as *it has even less leverage to control content creators*. A competitor could easily clone the project and create their own hosting platform where all content on the "evil" platform would immediately be accessible from the cloned one and users can migrate away from the evil platform by simply re-keying using the new platform's public key. 

This reintroduces competitive pressures into a market that is dominated by economies of scale. Imagine if you could keep all of your posts and connections from Twitter if you moved onto another platform that didn't censor things in a way you disapproved of? 

### Split Payments
The challenge of having a single payment responsible for paying to two invoices was, as noted above, accomplished through the use of HODL Invoices. With a HODL invoice a user can pay a lightning invoice to another user, but the payee of that invoice will be unable to settle, and therefore claim, the funds until revealing a secret. 

To achieve split payments, we do still need to have two invoices, but only one needs to be interacted with by the user. In the case of tipping, let's imagine that a user wants to tip 500 satoshis for a post. In exchange for managing data on the platform, Prism will charge a flat fee of 100 satoshis for transmitting tips. 

To facilitate this, the browser, under the hood, will query the boltwall server tied to the post (this is verifiable through Gaia) for an invoice for the amount of 500sats. This invoice is sent via http request to Prism. **Prism then creates a HODL invoice tied to the payment hash of the first invoice for 600 satoshis** (price of the tip + the fee). The Prism server then sends this invoice back to the user who pays the HODL invoice of 600 (the user's job is now done!). Because this 600sats was tied to a HODL invoice, and Prism doesn't have access to the preimage that it's locked to, we don't have access to these funds yet. 

In order to unlock these funds, Prism must pay 500sats to the first invoice. Paying this invoice will reveal a "secret", this secret can then be used to unlock the HODL invoice. 

So to recap, let's assume all parties start with 1000 satoshis: 
**Client: 1000, Prism: 1000, Owner: 1000**
1. Post owner generates an invoice for 500 satoshis
2. User sends this invoice to Prism
3. Prism sends a HODL invoice locked to the preimage of the first invoice back to the client
4. The client pays the HODL invoice of 600 to Prism. Balances are- **Client: 400, Prism: 1000 (+ 600), Owner: 1000**
5. Prism pays 500 to the content owner- **Client: 400, Prism: 500 (+600), Owner: 1500**
6. Prism takes the secret returned from paying the invoice and unlocks the HODL invoice. 

**Final balances:**
Client: 400
Prism: 1100
Owner: 1500

What's also interesting is that after step 4, if Prism doesn't follow through, even though the 600 is initially locked up, if it's never redeemed, **the client will receive a refund after a predetermined lockup period**.

### Self-Sovereign Paywalls
In order to have external lightning nodes that grant access to specific pieces of the platform, we needed an API layer on top lightning and we needed a way for the association between that paywall and the content on the platform to be known. 

Blockstack's Gaia storage service helps us solve the latter problem. Each post on Prism is stored as a `Document` model. For any content owner that wishes to charge for access to their content, they must store a URI that points to a Boltwall compatible API for retrieving invoices and authorizing requests as well as a _Caveat Key_ (i.e. a shared password that only Prism and the content owner know. This shared privacy is accomplished with the same (A)Symmetrical Key scheme outlined above). If a payment is made to a Boltwall node, a _discharge macaroon_ is shared in the response. This discharge macaroon is signed with the shared caveat key so that Prism can verify it came from the owner of the content and the discharge macaroon is tied directly to the original request for the content via a root macaroon. 

More details on this architecture can be found in the [Boltwall documentation](https://www.npmjs.com/package/boltwall)
