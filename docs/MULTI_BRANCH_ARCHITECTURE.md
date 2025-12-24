# Multi-Branch System Architecture

## Overview

The TravelOps multi-branch system enables companies (tenants) to manage multiple physical locations or operational bases. This architecture supports hierarchical branch structures, branch-specific data scoping, inter-branch transfers, and granular permission controls.

## Database Schema

### Core Tables

#### `branches` Table
The central table for branch management:

```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type branch_type NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    parent_branch_id UUID REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Branch Types
- `HEAD_OFFICE` - Main headquarters
- `REGIONAL_OFFICE` - Regional management office
- `OFFICE` - Standard office location
- `WAREHOUSE` - Storage/inventory location
- `OPERATIONAL_BASE` - Field operations base

### Related Tables

#### `branch_permissions`
Controls user access to specific branches:

```sql
CREATE TABLE branch_permissions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id),
    user_id UUID NOT NULL REFERENCES users(id),
    permission_level VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);
```

Permission Levels:
- `VIEW` - Read-only access
- `CREATE` - Can create records
- `EDIT` - Can modify records
- `DELETE` - Can delete records
- `MANAGE` - Full CRUD + manage branch settings
- `FULL` - Complete access including user management

#### `branch_transfers`
Tracks transfers between branches:

```sql
CREATE TABLE branch_transfers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    transfer_type VARCHAR(50) NOT NULL, -- RESOURCE, EMPLOYEE, GEAR, INVENTORY
    entity_id UUID NOT NULL,
    source_branch_id UUID NOT NULL REFERENCES branches(id),
    target_branch_id UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    initiated_by UUID REFERENCES users(id),
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    notes TEXT
);
```

### Branch-Scoped Tables

The following core tables include `branch_id` for data scoping:

- `users` - Users belong to a primary branch
- `resources` - Resources assigned to a branch
- `leads` - Leads assigned to a branch
- `bookings` - Bookings associated with a branch

## API Endpoints

### Branch Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches` | List all branches |
| GET | `/api/branches/:id` | Get branch by ID |
| GET | `/api/branches/code/:code` | Get branch by code |
| POST | `/api/branches` | Create new branch |
| PUT | `/api/branches/:id` | Update branch |
| DELETE | `/api/branches/:id` | Delete branch |
| GET | `/api/branches/hierarchy` | Get branch hierarchy tree |

### Branch Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/branches/:id/permissions` | Grant permission |
| DELETE | `/api/branches/:id/permissions/:userId` | Revoke permission |

### Branch Transfers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/branches/:id/transfers` | Initiate transfer |
| PUT | `/api/branches/transfers/:transferId/complete` | Complete transfer |
| PUT | `/api/branches/transfers/:transferId/cancel` | Cancel transfer |

## Frontend Architecture

### State Management

The `branchStore` (Zustand) manages branch selection state:

```typescript
import { useBranchStore, useSelectedBranch, useBranchFilterParams } from '@/store';

// Get selected branch
const selectedBranch = useSelectedBranch();

// Get filter params for API calls
const branchFilter = useBranchFilterParams();

// Use in API call
const { data } = useResources({ ...otherParams, ...branchFilter });
```

### Components

#### BranchSelector
A dropdown component for selecting branches:

```tsx
import { BranchSelector } from '@/components/common';

<BranchSelector
    value={selectedBranchId}
    onChange={setSelectedBranch}
    showAllBranches={true}
    className="w-[200px]"
/>
```

#### Props
- `value`: Selected branch ID(s)
- `onChange`: Callback when selection changes
- `branches`: Optional list (fetches from API if not provided)
- `showAllBranches`: Show "All Branches" option
- `multiple`: Enable multi-select

### Hooks

```typescript
import {
    useBranches,
    useBranch,
    useBranchesWithStats,
    useBranchHierarchy,
    useBranchMutations,
    useBranchPermissions,
} from '@/hooks';

// List branches
const { data, isLoading } = useBranches({ isActive: true });

// Get single branch
const { data: branch } = useBranch(branchId);

// Get branches with statistics
const { data: branchesWithStats } = useBranchesWithStats();

// Get hierarchy tree
const { data: hierarchy } = useBranchHierarchy();

// Mutations
const { createBranch, updateBranch, deleteBranch } = useBranchMutations();
```

### Pages

- `/branches` - Branch list with search and filters
- `/branches/new` - Create new branch
- `/branches/:id/edit` - Edit existing branch

## Usage Patterns

### 1. Global Branch Filter

Add `BranchSelector` to the header for app-wide filtering:

```tsx
// In MainLayout or Header component
const { selectedBranchId, setSelectedBranchById } = useBranchStore();

<BranchSelector
    value={selectedBranchId}
    onChange={(id) => setSelectedBranchById(id)}
    showAllBranches={true}
/>
```

### 2. Branch-Scoped API Calls

Use `useBranchFilterParams()` to add branch filtering:

```typescript
const branchFilter = useBranchFilterParams();

// In resource listing
const { data } = useQuery({
    queryKey: ['resources', branchFilter],
    queryFn: () => resourceApi.list(branchFilter),
});
```

### 3. Branch Hierarchy Display

Display branches in a tree structure:

```tsx
const { data: hierarchy } = useBranchHierarchy();

function BranchTree({ branch }: { branch: BranchWithChildren }) {
    return (
        <div className="ml-4">
            <div>{branch.name} ({branch.type})</div>
            {branch.children?.map(child => (
                <BranchTree key={child.id} branch={child} />
            ))}
        </div>
    );
}
```

### 4. Inter-Branch Transfers

Transfer resources/employees between branches:

```typescript
const { createTransfer, completeTransfer } = useBranchTransfers();

// Initiate transfer
await createTransfer({
    branchId: sourceBranchId,
    data: {
        transferType: 'RESOURCE',
        entityId: resourceId,
        targetBranchId: destinationBranchId,
        notes: 'Seasonal reallocation',
    },
});

// Complete transfer
await completeTransfer(transferId);
```

## Permission Model

### Permission Hierarchy

```
FULL
  └── MANAGE
       └── DELETE
            └── EDIT
                 └── CREATE
                      └── VIEW
```

### Checking Permissions

```typescript
// In service layer
const hasPermission = await branchRepository.getUserPermissions(
    tenantId,
    branchId,
    userId
);

if (hasPermission.some(p => ['MANAGE', 'FULL'].includes(p.permissionLevel))) {
    // Allow management operations
}
```

## Best Practices

1. **Always scope queries by branch** when `selectedBranchId` is set
2. **Use branch codes** for human-readable references (e.g., "NYC-HQ")
3. **Respect branch hierarchy** for reporting rollups
4. **Validate transfer permissions** before initiating transfers
5. **Cache branch list** - it changes infrequently

## Migration Notes

When migrating existing data to multi-branch:

1. Create a default branch for each tenant
2. Update existing records with `branch_id = default_branch_id`
3. Grant existing users FULL permission to default branch

```sql
-- Example migration for existing resources
UPDATE resources 
SET branch_id = (
    SELECT id FROM branches 
    WHERE tenant_id = resources.tenant_id 
    AND type = 'HEAD_OFFICE' 
    LIMIT 1
)
WHERE branch_id IS NULL;
```

## Future Enhancements

- [ ] Branch-level settings/configuration
- [ ] Branch operating hours
- [ ] Branch capacity planning
- [ ] Cross-branch reporting dashboard
- [ ] Branch performance metrics
- [ ] Automated resource rebalancing
