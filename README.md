# CryoEM Website

## Overview

This website provides a centralized platform for all cryoEM-related information in the lab, including a searchable grid database for sample tracking. It is designed to help track samples from plunging at the Vitrobot, through the microscope, and into data analysis.

## Features

- **Vitrobot input form:** Use this form while plunging grids to keep input uniform across the group, while still allowing flexibility for each session.
- **Grid database:** View all grids from current and past group members. Each grid can be edited and marked as trashed or shipped.
- **Microscope sessions:** View microscope session details, sorted by user
- **Admin functionalities:** For lab managers to enter new microscope sessions, track grid usage and users.
- **Blog:** For EM-related news and tips.

## Technologies Used

- PHP (backend, API)
- SQL (MariaDB for database setup)
- JavaScript (frontend, UI components, validation)
- HTML/CSS (user interface)
- TinyMCE (blog)

## Directory Structure

- `htdocs/`: Main web application files
- `include/`, `private/`: Configuration and sensitive files

## To Do

- Completely track grids from microscope through data analysis and deposition
- Complete validation

## Installation & Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/ASKrebs/upthomae-cryoem-website.git
   ```
2. Set up your database using `setup.sql`. EPFL users should read the guide `EPFL_INFO.md` for more information.
3. Copy `private/config.example.php` to `private/config.production.php` or `private/config.local.php` and update these files with your website, database name, and password.
4. For development, start your local server using a router file if needed. For production, follow your server provider's instructions for uploading files.

## Contributing

Pull requests and suggestions are welcome! Please follow coding standards.

## Contact

For questions, support, or feature requests, contact us via email or open an issue on GitHub.

## Acknowledgments

Thanks to all lab members and contributors for their input and feedback.

## License

License to be specified.
