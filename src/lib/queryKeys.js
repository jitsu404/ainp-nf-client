// Every TanStack Query key in one place. Keys are hierarchical, so invalidating a prefix
// refreshes everything below it: invalidateQueries({ queryKey: queryKeys.centres.all })
// refreshes centre lists, single centres and PI histories.

export const queryKeys = {
  centres: {
    all: ['centres'],
    list: (filters) => ['centres', 'list', filters],
    detail: (id) => ['centres', 'detail', id],
    pis: (id) => ['centres', 'detail', id, 'pis'],
  },
  users: {
    all: ['users'],
    list: (filters) => ['users', 'list', filters],
  },
}
