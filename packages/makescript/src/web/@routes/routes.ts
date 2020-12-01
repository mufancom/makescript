import {
  RootRouteMatchType,
  RouteMatch,
  Router as BoringRouter,
  schema,
} from 'boring-router';
import {BrowserHistory} from 'boring-router-react';

export const routeSchema = schema({
  $children: {
    home: true,
    scripts: {
      $exact: true,
      $children: {
        records: {
          $exact: true,
          $children: {
            recordId: {
              $exact: true,
              $match: /\d+/,
            },
          },
          $query: {
            'only-unexecuted': true,
          },
        },
        management: {
          $exact: true,
          $children: {
            scriptName: {
              $exact: true,
              $match: RouteMatch.SEGMENT,
            },
          },
        },
      },
    },
    makeflow: {
      $exact: true,
      $children: {
        login: true,
      },
    },
    tokens: true,
    login: true,
    initialize: true,
    notFound: {
      $match: /.*/,
    },
  },
});

export const history = new BrowserHistory();

export const router = new BoringRouter(history);

export const route = router.$route(routeSchema);

export type Router = RootRouteMatchType<typeof routeSchema, undefined, ''>;
