# Features of the CNC Tool Warehouse Management System

## Feature: Inventory Management
- **User Story**: As a warehouse manager, I want to be able to view the inventory levels of all CNC tools, so that I can ensure that tools are stocked and available for use.
- **Acceptance Criteria**:
  - The system must display a list of all tools in the inventory.
  - Each tool must show its quantity, location, and status (available, reserved, or out of stock).

## Feature: Tool Check-In/Check-Out
- **User Story**: As a CNC operator, I want to check out tools for use and return them when I am finished, so that I can manage the tools I have access to.
- **Acceptance Criteria**:
  - The system must allow users to check out and check in tools.
  - There must be a log of all check-outs and check-ins, including user information and timestamps.

## Feature: Tool Maintenance Tracking
- **User Story**: As a maintenance technician, I want to schedule and track maintenance for each tool, so that I can ensure all tools are functioning properly.
- **Acceptance Criteria**:
  - Users must be able to schedule maintenance and log completed maintenance activities.
  - The system must notify users when maintenance is due for a tool.

## Feature: Reporting and Analytics
- **User Story**: As a warehouse manager, I want to generate reports on tool usage and maintenance, so that I can identify trends and make informed decisions.
- **Acceptance Criteria**:
  - The system must allow users to generate reports based on various criteria (e.g., tool usage, maintenance history).
  - Reports must be exportable in multiple formats (PDF, Excel).

## Feature: Project Tool Management (Gestione Utensili per Progetto)
- **User Story**: As a CNC operator or project manager, I want to associate and track tools allocated to specific projects or production orders (commesse), so that tool usage, reservations, and consumption can be monitored per project.
- **Acceptance Criteria**:
  - The system must allow tools to be assigned, checked out, or tracked against specific project codes/names.
  - Movement history and inventory logs must record the project reference when specified.
  - Users can view tool requirements, allocated items, and usage history filtered by project.