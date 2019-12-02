import { Editor } from "./Editor";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";
import { useGun, getId, getUUID, getPub, getSet, put } from "nicks-gun-utils";

export const GunEditor = ({ id, Gun, gun, priv, epriv }) => {
  const cs = new GunContinuousSequence(gun);
  const pub = getPub(id);
  const pair = pub && priv && { pub, priv, epriv };
  const [data, onData] = useGun(Gun, useState, pair);

  useEffect(() => {
    gun.get(id).on(onData);

    gun
      .get(`${id}.atoms`)
      .on(onData)
      .map()
      .on(onData);
  }, [gun]);

  const document = {
    ...data[id],
    atoms: cs.sort(getSet(data, `${id}.atoms`))
  };

  return (
    <Editor
      getId={getId}
      document={document}
      id={id}
      onSetDocumentTitle={title => put(Gun, gun, id, "title", title, pair)}
      onAddAtom={async (atom, prev, next) => {
        const key = getUUID(gun);
        const atomId = `${id}.atoms.${key}`;
        await put(Gun, gun, atomId, "atom", atom, pair);
        await put(
          Gun,
          gun,
          atomId,
          "index",
          JSON.stringify(cs.getIndexBetween(atomId, prev, next)),
          pair
        );
        await put(Gun, gun, `${id}.atoms`, key, { "#": atomId }, pair);
      }}
      onDeleteAtom={async atomId => {
        await put(Gun, gun, `${id}.atoms`, /\w+$/.exec(atomId)[0], null, pair);
      }}
    />
  );
};
