import { BackendFactory } from 'dnd-core';
import React, { useEffect, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import BlurGate from '../components/BlurGate';
import EditorStore, { EditorContext } from '../EditorStore';
import { ReduxProvider } from '../reduxConnect';
import { DisplayModes } from '../actions/display';
import { OptionsContext } from '../components/hooks';
import { Value, Options } from '../types/node';

import { serialzeValue } from '../migrations/serialzeValue';
import deepEquals from '../utils/deepEquals';

import { Middleware, Store } from 'redux';
import { migrateValue } from '../migrations/migrate';
import { updateValue } from '../actions/value';
import { RootState } from '../types';

type ProviderProps = {
  lang?: string;
  onChangeLang?: (lang: string) => void;
  value: Value;
  onChange?: (v: Value) => void;
  dndBackend?: BackendFactory;
  blurGateDisabled?: boolean;
  blurGateDefaultMode?: DisplayModes;
  /**
   * pass custom redux store:. Might get deprecated in the future
   */
  store?: Store<RootState>;
  /**
   * pass custom redux middleware:. Might get deprecated in the future
   */
  middleware?: Middleware[];
} & Options;

const Provider: React.FC<ProviderProps> = ({
  lang,
  value,
  onChangeLang,
  onChange,
  children = [],
  dndBackend = HTML5Backend,
  blurGateDisabled = false,
  blurGateDefaultMode,
  cellPlugins,
  allowMoveInEditMode,
  childConstraints,
  allowResizeInEditMode,
  editModeResizeHandle,
  languages,
  pluginsWillChange,
  store: passedStore,
  middleware = [],
}) => {
  const editorStore = useMemo(() => {
    const store = new EditorStore({
      initialState: {
        reactPage: {
          __nodeCache: {},
          hover: null,
          focus: null,
          display: {
            mode: 'edit',
          },
          settings: {
            lang,
          },
          values: {
            past: [],
            present: migrateValue(value, {
              cellPlugins,
              lang,
            }),
            future: [],
          },
        },
      },
      store: passedStore,
      middleware,
    });
    return store;
  }, [passedStore, ...middleware]);
  const lastValueRef = useRef<Value>(value);
  useEffect(() => {
    let oldLang = lang;
    const handleChanges = () => {
      // notify outsiders to new language, when chagned in ui
      const newLang = editorStore.store.getState().reactPage.settings.lang;
      if (newLang !== oldLang || newLang !== lang) {
        oldLang = newLang;
        onChangeLang?.(newLang);
      }
      if (!onChange) {
        return;
      }
      //console.time('calculate notifiy on change');
      const currentValue = editorStore.store.getState().reactPage.values
        .present;

      if (!currentValue) {
        // console.timeEnd('calculate notifiy on change');
        return;
      }
      const serializedValue = serialzeValue(currentValue, cellPlugins);
      const serializedEqual = deepEquals(lastValueRef.current, serializedValue);

      if (serializedEqual) {
        //    console.timeEnd('calculate notifiy on change');
        return;
      }

      lastValueRef.current = serializedValue;
      //   console.timeEnd('calculate notifiy on change');
      onChange(serializedValue);
    };
    const unsubscribe = editorStore.store.subscribe(handleChanges);
    return () => {
      unsubscribe();
    };
  }, [editorStore, onChange, pluginsWillChange && cellPlugins]);

  useEffect(() => {
    const equal = deepEquals(value, lastValueRef.current);
    // value changed from outside
    if (!equal) {
      lastValueRef.current = value;

      const migratedValue = migrateValue(value, {
        cellPlugins,
        lang,
      });
      editorStore.store.dispatch(updateValue(migratedValue));
    }
  }, [value, pluginsWillChange && cellPlugins, lang]);
  useEffect(() => {
    // if changed from outside
    editorStore.setLang(lang);
  }, [editorStore, lang]);

  // prevent options from recreating all the time
  const optionsMemoized: Options = useMemo(() => {
    return {
      cellPlugins,
      pluginsWillChange,
      allowMoveInEditMode,
      allowResizeInEditMode,
      editModeResizeHandle,
      languages,
      childConstraints,
    };
  }, [
    pluginsWillChange && cellPlugins,
    allowMoveInEditMode,
    allowResizeInEditMode,
    editModeResizeHandle,
    languages,
    JSON.stringify(childConstraints ?? {}), // its an object, we prevent unessesary rerenders by stringify it
  ]);

  return (
    <DndProvider backend={dndBackend}>
      <ReduxProvider store={editorStore.store}>
        <OptionsContext.Provider value={optionsMemoized}>
          <EditorContext.Provider value={editorStore}>
            <BlurGate
              disabled={blurGateDisabled}
              defaultMode={blurGateDefaultMode}
            >
              {children}
            </BlurGate>
          </EditorContext.Provider>
        </OptionsContext.Provider>
      </ReduxProvider>
    </DndProvider>
  );
};

export default Provider;
