import React, { useState, useRef, useEffect, useCallback } from "react";
import diff from "fast-diff";
import { getPub } from "nicks-gun-utils";

export const Editor = ({
  id,
  document,
  content: newContent,
  onSetDocumentTitle,
  onAddAtoms,
  onDeleteAtoms
}) => {
  const pub = getPub(id);
  const title =
    (document && document.title) ||
    id.replace(`~${pub}.`, "").replace(`~${pub}`);
  const [editing, setEditing] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const ref = useRef(null);
  const [content, setContent] = useState(newContent);

  useEffect(() => {
    if (ref.current) {
      const [selectionStart, selectionEnd] = [
        "selectionStart",
        "selectionEnd"
      ].map(key => {
        const value = ref.current[key];
        let index = 0;
        let movement = 0;
        thefor: for (const [action, part] of diff(content, newContent)) {
          switch (action) {
            case diff.INSERT:
              movement += part.length;
              break;
            case diff.EQUAL:
              if (value < index + part.length) {
                break thefor;
              }
              break;
            case diff.DELETE:
              if (value < index + part.length) {
                movement -= value - index;
                break thefor;
              }

              movement -= part.length;
              index += part.length;
              break;
          }
        }
        return ref.current[key] + movement;
      });
      setContent(newContent);
      ref.current.selectionStart = selectionStart;
      ref.current.selectionEnd = selectionEnd;
    }
  }, [ref, newContent]);

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
            autoFocus
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
          {title}
        </h1>
      )}
      <textarea
        className="document-content"
        ref={ref}
        value={content}
        onChange={e => {
          const value = e.target.value;
          const cursor = ref.current.cursorIndex;
          setContent(value);
          setTimeout(() => {
            let index = 0;
            for (const [action, part] of diff(content, value, cursor)) {
              switch (action) {
                case diff.INSERT:
                  onAddAtoms(part, index);
                  break;
                case diff.EQUAL:
                  index += part.length;
                  break;
                case diff.DELETE:
                  onDeleteAtoms(index, part.length);
                  index += part.length;
                  break;
              }
            }
          }, 0);
        }}
        autoFocus
      />
    </div>
  );
};
