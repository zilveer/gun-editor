import { Editor } from "./Editor";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect, useMemo } from "react";
import { useGun, getId, getUUID, getPub, getSet } from "nicks-gun-utils";

const Gun = require("gun/gun");
require("gun/sea");
/*
require("gun/lib/radix");
require("gun/lib/radisk");
require("gun/lib/store");
require("gun/lib/rindexed");
require("gun/lib/webrtc");*/

export const GunEditor = ({ id, priv, epriv }) => {
  const [gun, setGun] = useState(null);
  const pub = getPub(id);
  const pair = pub && priv && { pub, priv, epriv };
  const [data, onData, put] = useGun(Gun, gun, useState, pair);

  useEffect(() => {
    const gun = Gun({
      peers: ["https://gunjs.herokuapp.com/gun"],
      uuid: () => Gun.state.lex() + "-" + Gun.text.random(12)
    });
    gun.get(id).on(onData);
    gun
      .get(`${id}.atoms`)
      .on(onData)
      .map()
      .on(onData);
    setGun(gun);
  }, []);

  const [document, setDocument] = useState({});
  const [content, setContent] = useState("");
  const cs = new GunContinuousSequence(gun);
  useEffect(() => {
    if (gun) {
      setDocument({ ...data[id] });

      setContent(
        cs
          .sort(getSet(data, `${id}.atoms`))
          .map(atom => atom.atom)
          .join("")
      );
    }
  }, [gun, data]);

  if (!gun) {
    return <div>Loading...</div>;
  }

  return (
    <Editor
      document={document}
      content={content}
      id={id}
      onSetDocumentTitle={title => put([id, "title", title])}
      onAddAtoms={(atoms, index) => {
        const puts = [];
        const allAtoms = cs.sort(getSet(data, `${id}.atoms`));
        for (const atom of atoms) {
          const key = getUUID(gun);
          const atomId = `${id}.atoms.${key}`;
          puts.push(
            [atomId, "atom", atom],
            [
              atomId,
              "index",
              JSON.stringify(
                cs.getIndexBetween(atomId, allAtoms[index - 1], allAtoms[index])
              )
            ],
            [`${id}.atoms`, key, { "#": atomId }]
          );
        }
        put(...puts);
      }}
      onDeleteAtoms={(index, length) => {
        const puts = [];
        const allAtoms = cs.sort(getSet(data, `${id}.atoms`));
        for (let i = 0; i < length; i++) {
          const atomId = getId(allAtoms[index + i]);
          puts.push([`${id}.atoms`, /[\w-]+$/.exec(atomId)[0], null]);
        }
        console.log("deleting");
        put(...puts);
      }}
    />
  );
};
