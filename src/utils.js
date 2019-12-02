const Gun = require("gun/gun");
const SEA = require("gun/sea");

export const getUUID = gun => gun.opt()._.opt.uuid();

export const getId = element => element && element["_"] && element["_"]["#"];

export const getPub = id => {
  let match;
  if ((match = /^~([^@].*)$/.exec(id))) {
    return match[1];
  } else if ((match = /^(.*)~(.*)\.$/.exec(id))) {
    return match[2];
  }
};

export const getSubUUID = (gun, pub) =>
  pub ? `${getUUID(gun)}~${pub}.` : getUUID(gun);

export const decrypt = async (node, seaMemo, pair) => {
  node = { ...node };
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (typeof value === "string" && value.startsWith("SEA{")) {
      if (value in seaMemo) {
        node[key] = seaMemo[value];
      } else {
        try {
          node[key] = await SEA.decrypt(value, pair);
          seaMemo[value] = node[key];
        } catch (e) {
          delete node[key];
        }
      }
    }
  }
  return node;
};

/*
export const verify = async (node, seaMemo) => {
  node = { ...node };
  const pub = getPub(getId(node));
  if (pub) {
    for (const key of Object.keys(node).filter(
      key => !["_", "pub"].includes(key)
    )) {
      const value = node[key];
      let verified;
      const stringified = JSON.stringify(value);
      if (stringified in seaMemo) {
        verified = seaMemo[stringified];
      } else {
        try {
          // gun provides auth values as stringified object ¯\_(ツ)_/¯
          verified = JSON.parse(value);
        } catch (e) {
          verified = await SEA.verify(value, pub);
          console.log(value, pub, verified);
        }
        verified = verified[":"];
        seaMemo[stringified] = verified;
      }
      node[key] = verified;
    }
  }
  return node;
};
*/

export const getSet = (data, id) => {
  const set = data[id];
  if (!set) {
    return [];
  }
  const arr = Object.keys(set)
    .filter(key => key !== "_")
    .map(key => set[key])
    .filter(Boolean)
    .map(ref => data[ref["#"]])
    .filter(Boolean);
  return arr;
};

export const put = async (gun, id, key, value, pair) => {
  if (pair && pair.epriv && value && typeof value !== "object") {
    value = await SEA.encrypt(value, pair);
  }

  if (pair && pair.priv) {
    value = await SEA.sign(
      {
        "#": id,
        ".": key,
        ":": value,
        ">": Gun.state()
      },
      pair
    );
  }

  gun
    .get(id)
    .get(key)
    .put(value);
};
