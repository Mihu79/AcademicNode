# 🎓 AcademicNode
> **Next-Generation Academic Social Platform**

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-Tailwind-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)

**AcademicNode** is a modern web platform dedicated to strengthening the academic community. Designed to facilitate fluid and collaborative interaction between students and professors, the platform offers a complete digital ecosystem with advanced profile features, real-time connections, and educational content sharing.

---

## ✨ Main Features

* 👥 **Advanced Connection System:** *Follow/Unfollow* functionality with real-time state updates.
* 📱 **Intuitive Interface (Social Media Style):** Dynamic display of profile statistics (followers and following counts).
* 🚀 **Interactive Navigation:** Detailed user tables featuring quick redirection to their respective profiles.
* 🖼️ **Smart Media Management:** Optimized avatar display with an automatic fallback system to default icons in case of network errors.
* 💻 **Fully Responsive Design:** Flawless user experience scaling seamlessly from desktop screens to mobile devices.

---

## 🗺️ Upcoming Features (Roadmap)

The development is ongoing. Here is a look at the planned enhancements for future releases:

| Feature | Description / Location |
| :--- | :--- |
| **Reset Password** | Secure flow to recover and reset user account credentials. |
| **Posts on Profile** | Ability for users to create and display updates directly on their personal feeds. |
| **Expanded Contact Details** | Adding email and phone number fields in the "About" section (displayed alongside city and country). |

---

## 🛠️ Architecture and Technologies

The application is built using a decoupled (Client-Server) architecture, based on the latest industry standards:

| Component | Technologies Used |
| :--- | :--- |
| **Backend** | `.NET 8 Web API`, `Entity Framework Core`, `SQL Server` / `SQLite` |
| **Frontend** | `Angular 17+`, `PrimeNG`, `TailwindCSS` / `PrimeFlex` |
| **Security** | Authentication and Authorization based on `JWT` (JSON Web Tokens) |

---

## 🚀 Quick Start Guide

Follow the steps below to run the application locally in your development environment.

### 1. Prerequisites
Ensure your environment is configured with the following tools:
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js](https://nodejs.org/) (LTS version)
* Angular CLI (install globally via `npm install -g @angular/cli`)

### 2. Starting the Server (Backend API)
Open a terminal and navigate to the server directory:

```bash
cd AcademicNode.API

# 1. Restore NuGet packages
dotnet restore

# 2. Apply migrations and create the database
dotnet ef database update

# 3. Run the application
dotnet run


```
### 3. Starting the Client (Angular Frontend)
Open a new terminal and navigate to the client directory:

```bash
cd AcademicNode.UI

# 1. Install dependencies (required only on the first run)
npm install

# 2. Build and serve the application
ng serve -o
```

