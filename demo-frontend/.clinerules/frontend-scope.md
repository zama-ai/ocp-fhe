# Frontend Design

to-do list:

- [x] top bar with wallet connection and role selector (Max)
- [ ] company creation **founder** view (Den)
- [ ] stock issuance **founder** view (Den)
- [ ] company cap table **founder** view (Max)
- [ ] company cap table **investor** view (Max)
- [ ] company cap table **public** view (Max)
- [ ] investments **investor** view
- [ ] companies list **public** view
- [ ] redis backend storage for company names, investor names and other non-chain stuff

## Top Bar with wallet connection and role selector

Top Bar (sticky):

- Left: icon + title: **“Rounds & Allocations (Mock)”**.
- Right:
  - Wallet Chip
  - Role selector (”FOUNDER | “INVESTOR”)

## Company Cap Table View

can be opened at path `/company/[company-name]`

### Data View

- Show basic public context about the selected company and round.
  - number of rounds
  - number of investors
- For the active round, list investors and their **encrypted** allocations:
  - **Shares** (confidential)
  - **Price / Share** (confidential)
  - **Investment** = shares × price/share (confidential)
- Allow inline decryption based on role permissions.
  - FOUNDER - can decrypt everything
  - INVESTOR - can decrypt only their own investments
  - PUBLIC - can’t decrypt anything
- If you’re the founder and owner of a company, it should be visually indicated.
- If you have invested in the company, it should be visually intuitive. And you should easily see which investments are accessible and which are restricted
- If you’re the founder and **NOT** the owner of the company, it should be visually indicated (e.g. show an alert).

### Stock Issuance

Should be accessible to **FOUNDER** who is the company owner. Opens a modal with a form:

- Round name (e.g. Seed or Series A)
- A dynamic table with possibility to add new row, delete existing row and fields:
  - Investor name (editable, text)
  - Investor address (editable, ethereum address with `isAddress` validation)
  - Shares (editable, number)
  - Price/Share (editable, $number)
  - Investment amount (automatically calculated field, $number)
- Button “Done”, completes the investment and creates appropriate transactions on-chain.

inspiration:

![image.png](attachment:dd0d212c-68c7-4cef-ba90-6ded8b650a50:image.png)

## Investments View

Can be opened at path `/investments`

Has a list of rounds at companies, which you have participated in:

- For each round, show the **encrypted** allocation:
  - **Shares** (confidential)
  - **Price / Share** (confidential)
  - **Investment** = shares × price/share (confidential)
- And a link to the company cap table page

## Company List

Can be opened at path `/company`

Shows a list of all companies which are created in the main smart contract with some basic info:

- company name
- founder address
- number of rounds

If you’re a **FOUNDER**, at the top you see the **My Companies** list with the **Create New Company** button.

### Create New Company

A simple modal form, which has following inputs:

- Company name

and a button “Create Company”, which creates appropriate transactions on-chain
