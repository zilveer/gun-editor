import { Editor } from "./Editor";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";

const Gun = require("gun/gun");

const getId = element => element && element["_"] && element["_"]["#"];

const useRerender = () => {
  const [, setRender] = useState({});
  const rerender = () => setRender({});
  return rerender;
};

const getSet = (data, id, key) => {
  const entity = data[id];
  if (!entity || !entity[key]) {
    return [];
  }
  const set = data[entity[key]["#"]];
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

export const GunEditor = ({ id }) => {
  const [gun, setGun] = useState(null);
  const [cs, setCs] = useState(null);
  const rerender = useRerender();

  useEffect(() => {
    const gun = Gun({
      peers: ["https://gunjs.herokuapp.com/gun"]
    });
    const cs = new GunContinuousSequence(gun);
    setGun(gun);
    setCs(cs);
  }, []);

  useEffect(() => {
    if (gun) {
      gun
        .get(id)
        .on(rerender)
        .get("atoms")
        .map()
        .on(rerender);
    }
  }, [gun]);

  if (!gun || !cs) {
    return <div>Loading...</div>;
  }

  const data = gun._.graph;
  const document = {
    ...data[id],
    atoms: cs.sort(getSet(data, id, "atoms"))
  };

  return (
    <Editor
      getId={getId}
      document={document}
      sort={cs.sort}
      id={id}
      onSetDocumentTitle={title =>
        gun
          .get(id)
          .get("title")
          .put(title)
      }
      onAddAtom={(atom, prev, next) => {
        const atomId = gun.opt()._.opt.uuid();
        gun.get(atomId).put({
          atom,
          index: JSON.stringify(cs.getIndexBetween(atomId, prev, next))
        });
        gun
          .get(id)
          .get("atoms")
          .get(atomId)
          .put({
            "#": atomId
          });
      }}
      onDeleteAtom={atomId => {
        gun
          .get(id)
          .get("atoms")
          .put({ [atomId]: null });
      }}
    />
  );
};
