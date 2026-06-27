/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — ECS Core: World, Entity, Component management
   ════════════════════════════════════════════════════════════════════════ */

export type Entity = number;

/**
 * ComponentStore is a typed Map from Entity -> Component data.
 * Each component type gets its own store for data locality.
 */
export class ComponentStore<T> {
  private data = new Map<Entity, T>();

  set(entity: Entity, component: T): void {
    this.data.set(entity, component);
  }

  get(entity: Entity): T | undefined {
    return this.data.get(entity);
  }

  has(entity: Entity): boolean {
    return this.data.has(entity);
  }

  delete(entity: Entity): boolean {
    return this.data.delete(entity);
  }

  entries(): IterableIterator<[Entity, T]> {
    return this.data.entries();
  }

  values(): IterableIterator<T> {
    return this.data.values();
  }

  keys(): IterableIterator<Entity> {
    return this.data.keys();
  }

  get size(): number {
    return this.data.size;
  }

  forEach(callback: (component: T, entity: Entity) => void): void {
    this.data.forEach(callback);
  }
}

/**
 * The World is the central ECS manager.
 * It owns all entities and component stores.
 */
export class World {
  private nextEntityId: Entity = 1;
  private entities = new Set<Entity>();
  private stores = new Map<string, ComponentStore<unknown>>();
  private entityNames = new Map<Entity, string>();

  /** Create a new entity and return its ID */
  createEntity(name?: string): Entity {
    const id = this.nextEntityId++;
    this.entities.add(id);
    if (name) {
      this.entityNames.set(id, name);
    }
    return id;
  }

  /** Destroy an entity and remove all its components */
  destroyEntity(entity: Entity): void {
    this.entities.delete(entity);
    this.entityNames.delete(entity);
    for (const store of this.stores.values()) {
      store.delete(entity);
    }
  }

  /** Check if an entity exists */
  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  /** Get entity name */
  getEntityName(entity: Entity): string {
    return this.entityNames.get(entity) || `Entity ${entity}`;
  }

  /** Set entity name */
  setEntityName(entity: Entity, name: string): void {
    this.entityNames.set(entity, name);
  }

  /** Get all entity IDs */
  getEntities(): Entity[] {
    return Array.from(this.entities);
  }

  /** Get or create a typed component store */
  getStore<T>(componentName: string): ComponentStore<T> {
    let store = this.stores.get(componentName);
    if (!store) {
      store = new ComponentStore<T>();
      this.stores.set(componentName, store);
    }
    return store as ComponentStore<T>;
  }

  /** Add a component to an entity */
  addComponent<T>(entity: Entity, componentName: string, data: T): void {
    if (!this.entities.has(entity)) {
      console.warn(`Entity ${entity} does not exist`);
      return;
    }
    this.getStore<T>(componentName).set(entity, data);
  }

  /** Get a component from an entity */
  getComponent<T>(entity: Entity, componentName: string): T | undefined {
    return this.getStore<T>(componentName).get(entity);
  }

  /** Check if entity has a component */
  hasComponent(entity: Entity, componentName: string): boolean {
    const store = this.stores.get(componentName);
    return store ? store.has(entity) : false;
  }

  /** Remove a component from an entity */
  removeComponent(entity: Entity, componentName: string): void {
    const store = this.stores.get(componentName);
    if (store) store.delete(entity);
  }

  /** Query all entities that have ALL of the specified components */
  query(...componentNames: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities) {
      let hasAll = true;
      for (const name of componentNames) {
        if (!this.hasComponent(entity, name)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) result.push(entity);
    }
    return result;
  }

  /** Reset the world, clearing all entities and components */
  clear(): void {
    this.entities.clear();
    this.entityNames.clear();
    this.stores.clear();
    this.nextEntityId = 1;
  }

  /** Serialize the world state to a JSON-friendly object */
  serialize(): WorldSnapshot {
    const snapshot: WorldSnapshot = { entities: [] };
    for (const entity of this.entities) {
      const entityData: EntitySnapshot = {
        id: entity,
        name: this.getEntityName(entity),
        components: {},
      };
      for (const [componentName, store] of this.stores.entries()) {
        if (store.has(entity)) {
          entityData.components[componentName] = structuredClone(store.get(entity));
        }
      }
      snapshot.entities.push(entityData);
    }
    return snapshot;
  }

  /** Deserialize a world snapshot, replacing current state */
  deserialize(snapshot: WorldSnapshot): void {
    this.clear();
    for (const entityData of snapshot.entities) {
      const entity = entityData.id;
      this.nextEntityId = Math.max(this.nextEntityId, entity + 1);
      this.entities.add(entity);
      if (entityData.name) {
        this.entityNames.set(entity, entityData.name);
      }
      for (const [componentName, data] of Object.entries(entityData.components)) {
        this.addComponent(entity, componentName, structuredClone(data));
      }
    }
  }
}

// ─── Serialization Types ──────────────────────────────────────────
export interface EntitySnapshot {
  id: number;
  name: string;
  components: Record<string, unknown>;
}

export interface WorldSnapshot {
  entities: EntitySnapshot[];
}
