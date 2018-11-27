/**
 * Test runner for JSON-LD Signatures library.
 *
 * @author Dave Longley <dlongley@digitalbazaar.com>
 * @author Manu Sporny <msporny@digitalbazaar.com>
 *
 * Copyright (c) 2014-2018 Digital Bazaar, Inc. All rights reserved.
 */

'use strict';
const {owners, testLoader, capabilities} = require('./mock-data');
const {addToLoader, Owner} = require('./helpers');

module.exports = function(options) {

  const {expect, jsonld, jsigs, ocapld} = options;

  // setup
  const oldLoader = jsonld.documentLoader;
  jsonld.documentLoader = testLoader(oldLoader);
  jsigs.use('jsonld', jsonld);

  // helper
  const format = input => console.log(JSON.stringify(input, null, 2));

  const alice = new Owner(owners.alice);
  const bob = new Owner(owners.bob);
  const carol = new Owner(owners.carol);
  const diana = new Owner(owners.diana);

  // run tests
  describe('ocapld.js', () => {
    context('Common', () => {
      describe('installation of library', () => {
        it('should successfully install the ocapld.js library', done => {
          ocapld.install(jsigs);
          expect(jsigs.proofPurposes.capabilityInvocation).to.exist;
          expect(jsigs.proofPurposes.capabilityDelegation).to.exist;
          done();
        });
      })
    });
    context('Invoker as keys', () => {
      describe('signing with capabilityInvocation', () => {
        beforeEach(() => {
          ocapld.install(jsigs);
        });
        it('should successfully sign w/ capabilityInvocation' +
          ' proofPurpose', async () => {
          let err;
          let signedDocument;
          try {
            signedDocument = await jsigs.sign(capabilities.root, {
              algorithm: 'Ed25519Signature2018',
              creator: alice.get('capabilityInvocation', 0).id,
              privateKeyBase58: alice.get('capabilityInvocation', 0).privateKeyBase58,
              proofPurposeOptions: {
                capability: capabilities.root.id
              },
              proofPurpose: 'capabilityInvocation',
            });
          } catch(e) {
            err = e;
          }
          expect(signedDocument).to.exist;
          expect(err).to.be.undefined;
        });

        it('should fail signing with capabilityInvocation proofPurpose and' +
          ' missing proofPurposeOptions', async () => {
          let err;
          let signedDocument;
          try {
            signedDocument = await jsigs.sign(capabilities.root, {
              algorithm: 'Ed25519Signature2018',
              creator: alice.get('capabilityInvocation', 0).id,
              privateKeyBase58: alice.get('capabilityInvocation', 0).privateKeyBase58,
              proofPurpose: 'capabilityInvocation',
            });
          } catch(e) {
            err = e;
          }
          expect(signedDocument).to.be.undefined;
          expect(err).to.exist;
          expect(err.message).to.equal('Please specify "capability"; the URI' +
            ' of the capability to be invoked.');
        });

        it('should successfully sign with capabilityDelegation proofPurpose',
          async () => {
          let err;
          let signedDocument;
          try {
            signedDocument = await jsigs.sign(capabilities.root, {
              algorithm: 'Ed25519Signature2018',
              creator: alice.get('capabilityDelegation', 0).id,
              privateKeyBase58: alice.get('capabilityDelegation', 0).privateKeyBase58,
              proofPurpose: 'capabilityDelegation',
            });
          } catch(e) {
            err = e;
          }
          expect(signedDocument).to.exist;
          expect(err).to.be.undefined;
        });
      });
      describe('signing with capabilityDelegation', () => {
        beforeEach(() => {
          ocapld.install(jsigs);
        });
        it('should successfully sign with capabilityDelegation proofPurpose',
          async () => {
          let err;
          let signedDocument;
          try {
            signedDocument = await jsigs.sign(capabilities.root, {
              algorithm: 'Ed25519Signature2018',
              creator: alice.get('capabilityDelegation', 0).id,
              privateKeyBase58: alice.get('capabilityDelegation', 0).privateKeyBase58,
              proofPurpose: 'capabilityDelegation',
            });
          } catch(e) {
            err = e;
          }
          expect(signedDocument).to.exist;
          expect(err).to.be.undefined;
        });
      });
      describe('verifying capability chains', () => {
        it('should successfully verify a self invoked root' +
          ' capability', async () => {
          let err;
          let res;
          try {
            const capInv = await jsigs.sign(capabilities.root, {
              algorithm: 'Ed25519Signature2018',
              creator: alice.get('capabilityInvocation', 0).id,
              privateKeyBase58: alice.get('capabilityInvocation', 0).privateKeyBase58,
              proofPurposeOptions: {
                capability: capabilities.root.id
              },
              proofPurpose: 'capabilityInvocation'
            });
            jsonld.documentLoader = addToLoader({
              documentLoader: jsonld.documentLoader,
              doc: {
                ...capInv,
                id: 'urn:foo'
              }
            });
            res = await jsigs.verify(capInv, {
              getPublicKey: jsigs.getPublicKey,
              getPublicKeyOwner: jsigs.getJsonLd,
              publicKey: alice.get('capabilityInvocation', 0).id,
              publicKeyOwner: alice.id(),
              proofPurposeOptions: {
                expectedTarget: capabilities.root.id
              }
            });
          } catch(e) {
            err = e;
          }
          expect(res).to.exist;
          expect(err).to.not.exist;
          expect(res.verified).to.be.true;
        });
        it('should successfully verify a capability chain of depth 2',
          async () => {
          let err;
          let res;
          try {
            const capabilityDelegation = {
              '@context': 'https://w3id.org/security/v2',
              id: 'https://whatacar.example/a-fancy-car/proc/7a397d7b',
              parentCapability: capabilities.root.id,
              invoker: bob.get('capabilityInvocation', 0).id
            };
            const capDel = await jsigs.sign(capabilityDelegation, {
              algorithm: 'Ed25519Signature2018',
              creator: alice.get('capabilityDelegation', 0).id,
              privateKeyBase58: alice.get('capabilityDelegation', 0).privateKeyBase58,
              proofPurpose: 'capabilityDelegation'
            });
            jsonld.documentLoader = addToLoader({
              documentLoader: jsonld.documentLoader,
              doc: capDel
            });
            const capabilityInvocation = {
              '@context': 'https://w3id.org/security/v2',
              id: 'https://example.org/bob/caps#1',
              invoker: bob.get('capabilityInvocation', 0).id
            };
            const capInv = await jsigs.sign(capabilityInvocation, {
              algorithm: 'Ed25519Signature2018',
              creator: bob.get('capabilityInvocation', 0).id,
              privateKeyBase58: bob.get('capabilityInvocation', 0).privateKeyBase58,
              proofPurposeOptions: {
                capability: 'https://whatacar.example/a-fancy-car/proc/7a397d7b'
              },
              proofPurpose: 'capabilityInvocation'
            });
            jsonld.documentLoader = addToLoader({
              documentLoader: jsonld.documentLoader,
              doc: capInv
            });
            res = await jsigs.verify(capInv, {
              getPublicKey: jsigs.getPublicKey,
              getPublicKeyOwner: jsigs.getJsonLd,
              publicKey: bob.get('capabilityInvocation', 0).id,
              publicKeyOwner: bob.id(),
              proofPurposeOptions: {
                expectedTarget: capabilities.root.id
              }
            });
          } catch(e) {
            console.log(e)
            err = e;
          }
          expect(res).to.exist;
          expect(err).to.not.exist;
          expect(res.verified).to.be.true;
        });
      });
    });
  });

  return Promise.resolve();

};