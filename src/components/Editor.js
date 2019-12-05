import React, { useState, useRef, useEffect, useCallback } from "react";
import diff from "fast-diff";
import { getPub } from "nicks-gun-utils";

export const Editor = ({
  getId,
  id,
  document,
  onSetDocumentTitle,
  onAddAtoms,
  onDeleteAtoms
}) => {
  const pub = getPub(id);
  const title =
    (document && document.title) ||
    id.replace(`~${pub}.`, "").replace(`~${pub}`);
  const [editing, setEditing] = useState(false);
  const [checkForUpdates, setCheckForUpdates] = useState();
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const ref = useRef(null);
  const [{ lastContent, lastChange }, setLastChange] = useState({
    lastContent: document.content
  });

  useEffect(() => {
    if (ref.current && document.content !== lastContent) {
      if (lastChange && lastChange > +new Date() - 1000) {
        // don't accept updates changes while typing, try again in a second
        // useful so external changes aren't disruptive,
        // but mainly because internal gun changes could be not up to date
        // and cause a regression in the textarea
        setTimeout(() => setCheckForUpdates({}), 1000);
        return;
      }
      const [selectionStart, selectionEnd] = [
        "selectionStart",
        "selectionEnd"
      ].map(key => {
        const value = ref.current[key];
        let index = 0;
        let movement = 0;
        thefor: for (const [action, part] of diff(
          ref.current.value,
          document.content
        )) {
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
      setLastChange({ lastContent: document.content });
      ref.current.value = document.content;
      ref.current.selectionStart = selectionStart;
      ref.current.selectionEnd = selectionEnd;
    }
  }, [ref, document.content, checkForUpdates]);

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
        defaultValue={lastContent}
        onChange={e => {
          const value = e.target.value;
          setLastChange({ lastContent: value, lastChange: +new Date() });
          setTimeout(() => {
            let index = 0;
            for (const [action, part] of diff(
              lastContent,
              value,
              ref.current.cursorIndex
            )) {
              switch (action) {
                case diff.INSERT:
                  onAddAtoms(
                    part,
                    document.atoms[index - 1],
                    document.atoms[index]
                  );
                  break;
                case diff.EQUAL:
                  index += part.length;
                  break;
                case diff.DELETE:
                  const ids = [];
                  for (let i = 0; i < part.length; i++) {
                    ids.push(getId(document.atoms[index + i]));
                  }
                  onDeleteAtoms(ids);
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
