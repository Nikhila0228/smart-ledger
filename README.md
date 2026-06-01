Smart Ledger:

A comprehensive personal finance management application designed to track income, manage expenses, and monitor monthly budgets with real-time financial insights.

Problem Statement:

Smart Ledger addresses the complexity of manual financial tracking by providing a digital-first solution. It solves the issues of disorganized spending habits and lack of visibility into monthly budget adherence, enabling users to maintain financial discipline through a clean, centralized interface.

Key Features:

Secure Authentication: JWT-based user login and signup system to protect personal financial data.

Real-Time Dashboard: A high-level overview of financial health, featuring interactive data visualizations to track income,expenses and savings.

Expense & Income Logging: A simplified interface to record daily financial transactions.

Budget Management: Tools to track and monitor monthly spending against set budgets.

Profile Personalization: Dynamic management of user settings and financial preferences.

Responsive UI: A modern, "Premium Modern Theme" providing a consistent experience across all devices.

System Architecture:

The application follows a standard tiered architecture:

Frontend: A modern React-based interface designed to provide a highly interactive and intuitive user experience.

Backend: A Spring Boot-based REST API service handling business logic and secure data processing.

Database: PostgreSQL for persistent storage of transaction records, user profiles, and budget data.

Authentication: Secure session handling using JWT tokens to ensure data privacy.

Tech Stack:

Backend: Java Spring Boot

Frontend: React.js, Axios, CSS3

Database & Tools: PostgreSQL, pgAdmin

Data Flow Summary:

The frontend (React) communicates with the backend (Spring Boot) via Axios, using JWT tokens for authorization. The Spring Boot API performs business logic (such as budget validation and transaction filtering) and handles all interactions with the PostgreSQL database, including data storage, retrieval, modification, and deletion.

Getting Started:

Clone the repository:

git clone https://github.com/Nikhila0228/smart-ledger.git

cd smart-ledger 

Start the Backend:

     Configure your PostgreSQL connection in `application.properties`.

     Run the Spring Boot application.
Start the Frontend:

     cd smart-ledger-ui
     npm install
     npm start

Access the application:

Dashboard: http://localhost:3000

Future Improvements:

Export Functionality: Generate and download monthly financial reports in PDF/CSV formats.

Multi-Currency Support: Seamlessly manage and track expenses across different currencies.

OAuth2 & MFA: Integrate social login and multi-factor authentication for enhanced security.

Shared Ledgers: Enable collaborative financial management for families or groups.

Offline Mode (PWA): Implement offline access capabilities using service workers.

Cloud Data Sync: Automated periodic backups of financial data to cloud storage.

Why This Project Matters:

Smart Ledger demonstrates the practical application of full-stack development, highlighting skills in building secure authentication flows, managing relational database schemas, and creating responsive front-end interfaces. It reflects a solid understanding of how to build reliable, user-centric financial tools.