/**
 * Fake `type` type for real flux action type.
 */
export enum RootType {}

/**
 * When an action has called, Function to be executed.
 */
export type FluxActionProcess<S, PL extends {[x: string]: any}> = (
  state: S,
  payload: PL,
) => S | void;

/**
 * Real action type of this.
 */
export interface FluxAction<
  AP extends {[x: string]: any},
  P extends keyof AP = keyof AP
> {
  type: RootType;
  actions: {type: keyof AP; payload: AP[P]}[];
}

/**
 * Data types connecting actions and processes.
 */
export interface FluxReducerItem<
  S,
  AP extends {[x: string]: any},
  SN extends string
> {
  type: keyof AP;
  actionProcess: FluxActionProcess<S, AP[keyof AP]>;
  scopeNames?: SN[];
}

/**
 * A Flux flow
 * @example
 *
 * interface State {
 *   foo: string;
 *   bar: number;
 * }
 *
 * // define  in the form of `{[actionName]: payload}`
 * interface ActionPayload {
 *   type1: {
 *     value: string;
 *   };
 *   type2: {
 *     value: number;
 *   }
 * }
 *
 * const flux = new Flux<State, ActionPayload>(initialState);
 * flux
 *   .addAction('type1', actionProcess)
 *   .addAction('type2', actionProcess);
 *
 * // For example, along with Redux's `createStore`.
 * createStore(flux.createReducer());
 *
 * // For example, along with Redux's `dispatch`.
 * dispatch(flux.act('type1', 'type2')({}, {}));
 *
 */
export class Flux<
  S,
  AP extends {[x: string]: any},
  SN extends string = string
> {
  private reducerStackCache: FluxReducerItem<S, AP, SN>[] | undefined;
  private reducerStack = [] as FluxReducerItem<S, AP, SN>[];
  allScopes = [] as SN[];
  currentScopes = [] as SN[];
  rootType = (Symbol('rootType') as unknown) as RootType;
  types = {} as {[P in keyof AP]: P};

  constructor(public initialState: S) {}

  private resetCache() {
    this.reducerStackCache = undefined;
  }

  private hasScope(scopeName: SN) {
    return this.allScopes.indexOf(scopeName) > -1;
  }

  private hasCurrentScope(scopeName: SN) {
    return this.currentScopes.indexOf(scopeName) > -1;
  }

  private registerScope(scopeName: SN): void {
    if (this.allScopes.indexOf(scopeName) === -1) {
      this.allScopes.push(scopeName);
    }
  }

  private registerCurrentScope(scopeName: SN): void {
    if (this.currentScopes.indexOf(scopeName) === -1) {
      this.currentScopes.push(scopeName);
    }
  }

  private unregisterCurrentScope(scopeName: SN): void {
    const index = this.currentScopes.indexOf(scopeName);
    this.currentScopes.splice(index, 1);
  }

  /**
   * To enable all scope
   */
  allOn() {
    if (this.currentScopes.length !== this.allScopes.length) {
      this.currentScopes = this.allScopes;
      this.resetCache();
    }

    return this;
  }

  on(scopeNames: SN[] | SN) {
    if (typeof scopeNames === 'string') {
      scopeNames = [scopeNames];
    }

    scopeNames.forEach(scopeName => {
      if (!this.hasCurrentScope(scopeName)) {
        this.registerCurrentScope(scopeName);
        this.resetCache();
      }
    });

    return this;
  }

  /**
   * To disable all scope
   */
  allOff() {
    if (this.currentScopes.length !== 0) {
      this.currentScopes = [];
      this.resetCache();
    }

    return this;
  }

  off(scopeNames: SN[] | SN) {
    if (typeof scopeNames === 'string') {
      scopeNames = [scopeNames];
    }

    scopeNames.forEach(scopeName => {
      if (this.hasCurrentScope(scopeName)) {
        this.unregisterCurrentScope(scopeName);
        this.resetCache();
      }
    });

    return this;
  }

  addAction<P extends keyof AP>(
    type: P,
    actionProcess: FluxActionProcess<S, AP[P]>,
    scopeNames: SN[],
  ): this;

  addAction<P extends keyof AP>(
    type: P,
    actionProcess: FluxActionProcess<S, AP[P]>,
  ): this;

  addAction<P extends keyof AP>(
    type: P,
    actionProcess: FluxActionProcess<S, AP[P]>,
    scopeNames?: SN[],
  ) {
    if (this.reducerStackCache !== undefined) {
      this.resetCache();
    }

    this.types[type] = (Symbol(type as string) as unknown) as P;
    if (scopeNames === undefined) {
      this.reducerStack.push({type: this.types[type], actionProcess});
    } else {
      this.reducerStack.push({
        type: this.types[type],
        actionProcess,
        scopeNames,
      });

      scopeNames.forEach(scopeName => {
        if (!this.hasScope(scopeName)) {
          this.registerScope(scopeName);
        }
      });
    }

    return this;
  }

  private getReducerItems() {
    if (this.reducerStackCache !== undefined) {
      return this.reducerStackCache;
    }

    const result = this.reducerStack.filter(reducerItem => {
      if (reducerItem.scopeNames === undefined) {
        return true;
      }

      return reducerItem.scopeNames.some(scopeName => {
        return this.hasCurrentScope(scopeName);
      });
    });

    this.reducerStackCache = result;

    return result;
  }

  createReducer(initialScopes: SN[] | SN = this.allScopes) {
    if (typeof initialScopes === 'string') {
      this.currentScopes = [initialScopes];
    } else {
      this.currentScopes = initialScopes;
    }

    return (state: S = this.initialState, action: FluxAction<AP>) => {
      if (action.type !== this.rootType) {
        return state;
      }

      action.actions.forEach(aAction => {
        const target = this.getReducerItems().find(reducerItem => {
          return aAction.type === reducerItem.type;
        });

        if (target === undefined) {
          return;
        }

        const result = target.actionProcess(state, aAction.payload);
        if (result !== undefined) {
          state = result;
        }
      });

      return state;
    };
  }

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP,
    T6 extends keyof AP,
    T7 extends keyof AP,
    T8 extends keyof AP,
    T9 extends keyof AP,
    T10 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5,
    t6: T6,
    t7: T7,
    t8: T8,
    t9: T9,
    t10: T10,
  ): ((
    p1: AP[T1],
    p2: AP[T2],
    p3: AP[T3],
    p4: AP[T4],
    p5: AP[T5],
    p6: AP[T6],
    p7: AP[T7],
    p8: AP[T8],
    p9: AP[T9],
    p10: AP[T10],
  ) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP,
    T6 extends keyof AP,
    T7 extends keyof AP,
    T8 extends keyof AP,
    T9 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5,
    t6: T6,
    t7: T7,
    t8: T8,
    t9: T9,
  ): ((
    p1: AP[T1],
    p2: AP[T2],
    p3: AP[T3],
    p4: AP[T4],
    p5: AP[T5],
    p6: AP[T6],
    p7: AP[T7],
    p8: AP[T8],
    p9: AP[T9],
  ) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP,
    T6 extends keyof AP,
    T7 extends keyof AP,
    T8 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5,
    t6: T6,
    t7: T7,
    t8: T8,
  ): ((
    p1: AP[T1],
    p2: AP[T2],
    p3: AP[T3],
    p4: AP[T4],
    p5: AP[T5],
    p6: AP[T6],
    p7: AP[T7],
    p8: AP[T8],
  ) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP,
    T6 extends keyof AP,
    T7 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5,
    t6: T6,
    t7: T7,
  ): ((
    p1: AP[T1],
    p2: AP[T2],
    p3: AP[T3],
    p4: AP[T4],
    p5: AP[T5],
    p6: AP[T6],
    p7: AP[T7],
  ) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP,
    T6 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5,
    t6: T6,
  ): ((
    p1: AP[T1],
    p2: AP[T2],
    p3: AP[T3],
    p4: AP[T4],
    p5: AP[T5],
    p6: AP[T6],
  ) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5,
  ): ((
    p1: AP[T1],
    p2: AP[T2],
    p3: AP[T3],
    p4: AP[T4],
    p5: AP[T5],
  ) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
  ): ((p1: AP[T1], p2: AP[T2], p3: AP[T3], p4: AP[T4]) => FluxAction<AP>);

  act<T1 extends keyof AP, T2 extends keyof AP, T3 extends keyof AP>(
    t1: T1,
    t2: T2,
    t3: T3,
  ): ((p1: AP[T1], p2: AP[T2], p3: AP[T3]) => FluxAction<AP>);

  act<T1 extends keyof AP, T2 extends keyof AP>(
    t1: T1,
    t2: T2,
  ): ((p1: AP[T1], p2: AP[T2]) => FluxAction<AP>);
  act<T1 extends keyof AP>(t1: T1): ((p1: AP[T1]) => FluxAction<AP>);

  act<
    T1 extends keyof AP,
    T2 extends keyof AP,
    T3 extends keyof AP,
    T4 extends keyof AP,
    T5 extends keyof AP,
    T6 extends keyof AP,
    T7 extends keyof AP,
    T8 extends keyof AP,
    T9 extends keyof AP,
    T10 extends keyof AP
  >(
    t1: T1,
    t2?: T2,
    t3?: T3,
    t4?: T4,
    t5?: T5,
    t6?: T6,
    t7?: T7,
    t8?: T8,
    t9?: T9,
    t10?: T10,
  ) {
    return (
      p1: AP[T1],
      p2?: AP[T2],
      p3?: AP[T3],
      p4?: AP[T4],
      p5?: AP[T5],
      p6?: AP[T6],
      p7?: AP[T7],
      p8?: AP[T8],
      p9?: AP[T9],
      p10?: AP[T10],
    ): FluxAction<AP> => {
      const types = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10].filter(
        Boolean,
      ) as (keyof AP)[];
      const payloads = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10].filter(
        Boolean,
      ) as AP[keyof AP];

      return {
        type: this.rootType,
        actions: types.map((type, i) => {
          return {type: this.types[type], payload: payloads[i]};
        }),
      };
    };
  }
}
