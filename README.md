# CryoEM Website

## Overview

This website provides a centralized platform for all cryoEM-related information in the lab, including a searchable grid database for sample tracking. It is designed to help track samples from plunging at the Vitrobot, through the microscope, and into data analysis.

## Features

- **Vitrobot input form:** Use this form while plunging grids to keep input uniform across the group, while still allowing flexibility for each session.
- **Grid database:** View all grids from current and past group members. Each grid can be edited and marked as trashed or shipped.
- **Microscope sessions:** (To be implemented) Log microscope sessions and automatically link grids from plunging to microscope.
- **Admin functionalities:** For lab managers to track grid usage and users.
- **Blog:** (To be implemented) For EM-related news and tips.

## Technologies Used

- PHP (backend, API)
- SQL (MariaDB for database setup)
- JavaScript (frontend, UI components, validation)
- HTML/CSS (user interface)

## Directory Structure

- `htdocs/`: Main web application files
- `include/`, `private/`: Configuration and sensitive files

## To Do

- Implement microscope tracking, preferably with the ability to upload images
- Start the blog
- Track grids from microscope through data analysis and deposition

## Installation & Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/ASKrebs/upthomae-cryoem-website.git
   ```
2. Set up your database using `setup.sql`. EPFL users should read the guide `EPFL_INFO.md` for more information.
3. Copy `private/config.example.php` to `private/config.production.php` or `private/config.local.php` and update these files with your website, database name, and password.
4. For development, start your local server using a router file if needed. For production, follow your server provider's instructions for uploading files.

## Contributing

Pull requests and suggestions are welcome! Please follow coding standards and add tests for new features.

## Contact

For questions, support, or feature requests, contact us via email or open an issue on GitHub.

## Acknowledgments

Thanks to all lab members and contributors for their input and feedback.

## License

License to be specified.
