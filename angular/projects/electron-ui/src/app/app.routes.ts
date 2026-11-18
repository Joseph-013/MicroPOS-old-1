import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/guest/login',
    pathMatch: 'full',
  },
  {
    path: 'guest',
    loadComponent: () =>
      import('./shared/components/guest-layout/guest-layout').then((m) => m.GuestLayout),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/guest/login/login').then((m) => m.Login),
      },
    ],
  },
  {
    path: 'authenticated',
    loadComponent: () =>
      import('./shared/components/authenticated-layout/authenticated-layout').then(
        (m) => m.AuthenticatedLayout,
      ),
    children: [
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/authenticated/checkout/checkout').then((m) => m.Checkout),
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./features/authenticated/payment/payment').then((m) => m.Payment),
      },
      {
        path: 'sales-orders',
        loadComponent: () =>
          import('./features/authenticated/sales-orders/sales-orders').then((m) => m.SalesOrders),
      },
      {
        path: 'sales-orders/:orderNumber',
        loadComponent: () =>
          import('./features/authenticated/sales-orders/sales-orders').then((m) => m.SalesOrders),
      },
      {
        path: 'items',
        loadComponent: () => import('./features/authenticated/items/items').then((m) => m.Items),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/authenticated/settings/settings').then((m) => m.Settings),
        children: [
          {
            path: 'configure-receipt-printer',
            loadComponent: () =>
              import('./shared/components/receipt-printer-configuration/receipt-printer-configuration').then(
                (m) => m.ReceiptPrinterConfiguration,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
