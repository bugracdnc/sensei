declare global {
  interface Window {
    electronAPI: {
      saveClass: (cls: Classes) => Promise<string>;
      loadClass: (className: string) => Promise<Classes>;
      listClasses: () => Promise<Classes[]>;
      removeClass: (className: string) => Promise<void>;
      log: (msg: string) => void;
    };
  }
}

import { useEffect, useState, useCallback } from "react";
import "./App.css";
import type { Classes } from "./components/models";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [classesList, setClassesList] = useState<Classes[]>([]);
  const [inputtedValue, setInputtedValue] = useState("");

  const log = async (msg: string) => {
    window.electronAPI.log(msg);
  };

  const addClass = async (cls: Classes) => {
    try {
      const path = await window.electronAPI.saveClass(cls);
      log(`Saved class ${cls.className} at: ` + path);
    } catch (err) {
      log(`Error saving class: ${err}`);
    }
  };

  /*const loadClass = async (className: string) => {
    const cls: Classes = await window.electronAPI.loadClass(className);
    log(`Loaded ${cls.className}`);
    return cls;
  };*/

  const removeClass = async (className: string) => {
    try {
      await window.electronAPI.removeClass(className);
      await getClasses();
    } catch (err) {
      log(`Error removing class: ${err}`);
    }
  };

  const getClasses = useCallback(async () => {
    try {
      const classes = await window.electronAPI.listClasses();
      log(`Setting classes list with ${classes.length} items...`);
      setClassesList(classes);
    } catch (err) {
      log(`Error loading classes: ${err}`);
    }
  }, []);

  useEffect(() => {
    getClasses();
  }, [getClasses]);

  async function addNewClass() {
    if (!inputtedValue.trim()) return;

    const cls: Classes = {
      className: inputtedValue,
      id: uuidv4(),
      grade: undefined,
      students: [],
      studentCount: 0,
    };
    setInputtedValue(""); // reset input
    log(`Trying to add the class ${cls.className}`);
    await addClass(cls);
    await getClasses(); // to refresh after saving
  }

  return (
    <main className="container">
      <ul>
        {classesList.map((cls) => {
          return (
            <li className="classes-row" key={cls.id}>
              <p className="classes-label">{cls.className}</p>
              <button
                className="classes-btn"
                onClick={() => removeClass(cls.className)}
              >
                X
              </button>
            </li>
          );
        })}
      </ul>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          addNewClass();
        }}
      >
        <input
          id="className-input"
          placeholder="Add new class..."
          value={inputtedValue}
          onChange={(e) => setInputtedValue(e.target.value)}
        />
        <button type="submit">Add Class</button>
      </form>
    </main>
  );
}

export default App;
