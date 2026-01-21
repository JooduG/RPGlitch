# Dexie.js Essentials

## Initialization

Dexie is used for IndexedDB persistence.

```js
import Dexie from "dexie"
const db = new Dexie("MyDatabase")
db.version(1).stores({
    friends: "++id, name, age",
})
```

## Svelte 5 Integration (useObservable alternative)

In Svelte 5, you can use `$state` with Dexie's live queries.

```js
import { liveQuery } from "dexie"
let friends = $state([])

$effect(() => {
    const query = liveQuery(() => db.friends.toArray())
    const subscription = query.subscribe((value) => {
        friends = value
    })
    return () => subscription.unsubscribe()
})
```

## CRUD Operations

- **Add**: `await db.friends.add({ name: 'Alice', age: 25 })`
- **Put**: `await db.friends.put({ id: 1, name: 'Alice', age: 26 })`
- **Get**: `const alice = await db.friends.get(1)`
- **Delete**: `await db.friends.delete(1)`
- **Bulk**: `await db.friends.bulkAdd([...])`

## Querying

- **Filter**: `db.friends.where('age').above(18).toArray()`
- **Primary Key**: `db.friends.get(id)`
