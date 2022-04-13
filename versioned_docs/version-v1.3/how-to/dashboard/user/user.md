---
title: User management
---

Once installed VelaUX has one built-in `admin` user that has full access to the system. it is recommended to use this user only for initial configuration and then create new user or configure SSO integration.

## Local users/accounts

The local users/accounts feature serves two main use-cases:

* For the restful API users，it is possible to configure an API account with limited permissions and generate an authentication token. users can use token to communicate with the API to create applications, etc.
* For a very small team where use of SSO integration might be considered an overkill. There could only use local users to authentication. 

### Get full users list

If login user have list users permission, he could switch to the `Platform/Users` page and get full users list.

![user list](https://static.kubevela.net/images/1.3/user-dashboard.jpg)

As shown in the picture above， there are user's name、alias, and platform roles in tables. we will record the user's last login time and show it.

### Creating users

Click the `New User` button, you can open the drawer page for creating a user. you should input some required info, such as the user's name、email, and password. Click the `Create` button then complete.

### Enable/disable users

You can click the disable or enable button, it could set the user's status. If a user is disabled, this user can not login.

### Reset user's password

You can click the reset password button and input a new password then commit it.

### Updating users

For existing users supports updating alias and platform role information. If a user has an empty email, support set a new email.

## SSO

SSO is our recommended way, please refer to [SSO login](../../../tutorials/sso) document.
