module.exports = {
  "@context": {
    "@version": 1.1,

    "wl": "https://w3id.org/webledger#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",

    "Elector": "wl:Elector",
    "RecoveryElector": "wl:RecoveryElector",

    "blockHeight": "wl:blockHeight",
    "elector": {"@id": "wl:elector", "@type": "@id"},
    "electorPool": {"@id": "wl:electorPool", "@type": "@id", "@container": "@set"},
    "maximumElectorCount": {"@id": "wl:maximumElectorCount", "@type": "xsd:integer"}
  }
};
