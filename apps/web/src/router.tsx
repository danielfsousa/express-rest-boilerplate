import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  });
}
