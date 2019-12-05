import { Editor } from "./Editor";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";
import { useGun, getId, getUUID, getPub, getSet } from "nicks-gun-utils";

const Gun = require("gun/gun");
require("gun/sea");

export const GunEditor = ({ id, priv, epriv }) => {
  const [gun, setGun] = useState(null);
  const pub = getPub(id);
  const pair = pub && priv && { pub, priv, epriv };
  const [data, onData, put] = useGun(Gun, gun, useState, pair);

  useEffect(() => {
    const gun = Gun({
      peers: ["https://gunjs.herokuapp.com/gun"],
      uuid: () => Gun.state.lex() + "-" + Gun.text.random()
    });
    gun.get(id).on(onData);
    gun
      .get(`${id}.atoms`)
      .on(onData)
      .map()
      .on(onData);
    setGun(gun);
  }, []);

  const [document, setDocument] = useState();
  const cs = new GunContinuousSequence(gun);
  useEffect(() => {
    if (gun) {
      const atoms = cs.sort(getSet(data, `${id}.atoms`));
      setDocument({
        ...data[id],
        atoms,
        content: atoms.map(atom => atom.atom).join("")
      });
    }
  }, [gun, data]);

  if (!document) {
    return <div>Loading...</div>;
  }

  return (
    <Editor
      getId={getId}
      document={document}
      id={id}
      onSetDocumentTitle={title => put([id, "title", title])}
      onAddAtoms={async (atoms, prev, next) => {
        const puts = [];
        for (const atom of atoms) {
          const key = getUUID(gun);
          const atomId = `${id}.atoms.${key}`;
          puts.push(
            [atomId, "atom", atom],
            [
              atomId,
              "index",
              JSON.stringify(cs.getIndexBetween(atomId, prev, next))
            ],
            [`${id}.atoms`, key, { "#": atomId }]
          );
        }
        await put(...puts);
      }}
      onDeleteAtoms={async atomIds => {
        await put(
          ...atomIds.map(atomId => [
            `${id}.atoms`,
            /\w+$/.exec(atomId)[0],
            null
          ])
        );
      }}
    />
  );
};
