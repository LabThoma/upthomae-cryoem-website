# EPFL CryoEM Website Info

This document provides specific information for EPFL users on how to request and access a LAMP server from the university.

## Request a LAMP server for your group

- Fill out the form at the bottom of the page to request a LAMP server and generate a website name for your group:  
  https://www.epfl.ch/campus/services/website/web-services/lamp-hosting-for-mini-websites/
- Be sure to add all team members who should have administrator rights when submitting the form.
- After submission, the IT team will contact you with details on how to get your website username and password.

## Accessing university website tools

- **Uploading files:** EPFL recommends using Cyberduck, but any WebDAV tool will work.
- **Database:**  
  https://lamp-phpmyadmin.epfl.ch  
  To set up your database, go to the SQL tab in phpMyAdmin, paste the complete SQL file `setup.sql`, and run it to generate the required tables.
- **Log files:**  
  https://lamp-logs.epfl.ch/login  
  Access with your EPFL username (not your email) and your Tequila password.

## EntraID setup

- Your website must be password protected and only accessible to your team, in accordance with EPFL guidelines.
- For EntraID to work, you need to register your website via https://app-portal.epfl.ch/ (may only work in a private window) and specify which groups should have access
- Generate the `vendor` folder via `composer install` or generate it locally`composer require jumbojett/openid-connect-php vlucas/phpdotenv` and upload the folder via Cyberduck
- Create `entra/.env` with your credentials per these guides: https://github.com/epfl-si/entra-id-auth-examples/blob/main/oidc/PHP/Jumbojett-OIDC/php-oidc-jumbojett-simple/TEQUILA_MIGRATION_EXAMPLE.md & https://github.com/epfl-si/entra-id-auth-examples/tree/main/oidc/PHP/Jumbojett-OIDC

## Guidelines

- Always follow EPFL IT and data management guidelines when using the platform.
- For LAMP server technical support, contact 1234@epfl.ch.
- For website help, open an Issue on GitHub or email the website team directly.

---

For more details regarding the website itself, refer to the main README.md.
