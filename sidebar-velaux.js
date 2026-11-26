// Sidebar for the VelaUX section (/velaux), laid out for someone running VelaUX: install it, ship applications with
// it, deliver them, manage who can do what, extend its forms, and the references.
module.exports = {
  velaux: [
    {type: 'doc', id: 'overview', label: 'Overview'},
    {type: 'doc', id: 'install', label: 'Install'},
    {
      type: 'category',
      label: 'Applications',
      items: ['applications/operations', 'applications/cloud-shell'],
    },
    {
      type: 'category',
      label: 'Delivery',
      items: ['delivery/targets', 'delivery/triggers', 'delivery/harbor-trigger'],
    },
    {
      type: 'category',
      label: 'Users and Access',
      items: [
        {type: 'doc', id: 'users/overview', label: 'Users'},
        'users/projects',
        'users/rbac',
        'users/sso',
      ],
    },
    {type: 'category', label: 'Extend', items: ['extend/ui-schema']},
    {
      type: 'category',
      label: 'Reference',
      items: ['reference/rest-api', 'reference/user-improvement-plan'],
    },
  ],
};
