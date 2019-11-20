import React, { useState, useRef, useEffect, useCallback } from "react";

const SPECIAL_KEYS = {
  Enter: "\n"
};
export const Editor = ({ getId, document, onSetDocumentTitle, onAddAtom }) => {
  const [editing, setEditing] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [cursor, setCursor] = useState(null);
  const cursorIndex = cursor
    ? document.atoms.findIndex(atom => getId(atom) === cursor)
    : document.atoms.length;

  useEffect(() => {
    if (ref.current) {
      ref.current.selectionStart = cursorIndex;
    }
  }, [document, cursorIndex]);

  const ref = useRef(null);

  return (
    <div className="document">
      {editing ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            onSetDocumentTitle(newDocumentTitle);
            setEditing(false);
          }}
        >
          <input
            value={newDocumentTitle}
            onChange={e => setNewDocumentTitle(e.target.value)}
            placeholder="document title"
          />
        </form>
      ) : (
        <h1
          onDoubleClick={e => {
            setNewDocumentTitle(document.title);
            setEditing(true);
          }}
          className="document-title"
        >
          {(document && document.title) || "Set document title"}
        </h1>
      )}
      <textarea
        className="document-content"
        ref={ref}
        onClick={() =>
          setCursor(getId(document.atoms[ref.current.selectionStart]))
        }
        onKeyDown={e => {
          setCursor(getId(document.atoms[ref.current.selectionStart]));

          if (e.key === "Backspace") {
          }

          let key;
          if (SPECIAL_KEYS[e.key]) {
            key = SPECIAL_KEYS[e.key];
          } else if (e.key.length === 1) {
            key = e.key;
          } else {
            return;
          }
          onAddAtom(
            key,
            document.atoms[ref.current.selectionStart - 1],
            document.atoms[ref.current.selectionStart]
          );
        }}
        onChange={() => {
          setTimeout(() => {
            ref.current.selectionStart = ref.current.selectionEnd = cursorIndex;
          }, 10);
        }}
        value={document.atoms.map(atom => atom.atom).join("")}
        autoFocus
      />
    </div>
  );
};
