# Polynesian Technology Taxonomy

## Overview

This taxonomy provides a structured classification system for technology terminology in the RMHokeoUnuhina translation management system. It supports multi-level tagging to organize terms across domains, functions, and contexts while maintaining compatibility with existing namespace patterns.

## Taxonomy Structure

The system uses a **three-level hierarchical tagging approach** that allows multiple tags per term for maximum flexibility and discoverability.

---

## Level 1: Primary Domain Tags

### Core Technology Domains

#### `technology.hardware`
**Physical devices, components, and equipment**
- Computers, laptops, desktops
- Smartphones, tablets, mobile devices  
- Servers, networking equipment
- Storage devices, memory
- Input/output devices (keyboard, mouse, monitor)
- Processors, chips, circuits

#### `technology.software`
**Applications, programs, and systems**
- Operating systems
- Applications and programs
- Programming languages
- Development tools
- Utilities and system software
- Firmware and embedded software

#### `technology.networking`
**Internet, connectivity, and communications**
- Internet and web technologies
- Network protocols and standards
- Wireless technologies (WiFi, Bluetooth, cellular)
- Network hardware (routers, switches)
- Communication services
- Network security

#### `technology.data`
**Information, storage, and management**
- Databases and data storage
- File systems and formats
- Data processing and analytics
- Backup and recovery
- Cloud storage services
- Data visualization

#### `technology.security`
**Protection, privacy, and authentication**
- Cybersecurity tools and practices
- Authentication and authorization
- Encryption and cryptography
- Privacy protection
- Security protocols
- Threat protection

#### `technology.ai`
**Artificial intelligence and machine learning**
- Machine learning algorithms
- Neural networks and deep learning
- Natural language processing
- Computer vision
- Robotics and automation
- AI applications and services

#### `technology.mobile`
**Mobile devices and applications**
- Smartphones and tablets
- Mobile operating systems
- Mobile applications
- Mobile development
- Mobile connectivity
- Mobile security

#### `technology.web`
**Web technologies and internet services**
- Websites and web applications
- Web browsers and search engines
- Web development technologies
- Social media platforms
- E-commerce and online services
- Web standards and protocols

---

## Level 2: Functional Tags

### User Interface (Current Pattern - Maintained)

#### `ui.interface`
**General user interface elements**
- Settings, preferences, configuration
- About sections, help systems
- Instructions and documentation
- Statistics and reporting interfaces

#### `ui.buttons`
**Interactive controls and actions**
- OK, cancel, save, delete actions
- Navigation controls (back, next, submit)
- Game actions (new game, refresh, reset)

#### `ui.states`
**System and application states**
- Loading, processing indicators
- Success, error, failure messages
- Progress and completion states
- Availability status

#### `ui.navigation`
**Movement and control elements**
- Menu systems and navigation
- Search and discovery
- Workflow and process controls

### Business and Enterprise

#### `business.enterprise`
**Corporate and organizational technology**
- Enterprise software systems
- Business intelligence tools
- Project management systems
- Customer relationship management
- Enterprise resource planning
- Collaboration and productivity tools

#### `business.finance`
**Financial and accounting technology**
- Accounting software and systems
- Financial analysis tools
- Payment processing systems
- Banking and financial services
- Investment and trading platforms

#### `business.management`
**Management and administration tools**
- Human resources systems
- Asset management tools
- Workflow management
- Quality management systems
- Compliance and governance tools

### Consumer and Personal

#### `consumer.personal`
**Individual user technology**
- Personal computers and devices
- Home automation systems
- Entertainment systems
- Personal productivity tools
- Social and communication tools

#### `consumer.gaming`
**Gaming and entertainment technology**
- Video games and gaming systems
- Entertainment platforms
- Media streaming services
- Gaming hardware and accessories

#### `consumer.lifestyle`
**Daily life and personal technology**
- Health and fitness technology
- Smart home devices
- Transportation technology
- Shopping and e-commerce
- Personal organization tools

### Development and Technical

#### `development.programming`
**Software creation and development**
- Programming languages and frameworks
- Development environments and tools
- Version control systems
- Testing and quality assurance
- Deployment and DevOps tools

#### `development.design`
**Design and user experience**
- User interface design tools
- Graphic design software
- Prototyping and wireframing
- User experience methodology
- Design systems and standards

---

## Level 3: Context Tags

### Audience Classification

#### `audience.business`
**Business and professional context**
- Corporate environments
- Professional services
- Business-to-business applications
- Enterprise solutions

#### `audience.consumer`
**General public and personal use**
- Home users
- Personal applications
- Consumer products
- Entertainment and leisure

#### `audience.technical`
**Developers and technical specialists**
- Software developers
- System administrators
- IT professionals
- Technical documentation

#### `audience.educational`
**Learning and training context**
- Educational institutions
- Training programs
- Learning management systems
- Academic research

### Complexity Classification

#### `complexity.basic`
**Fundamental concepts and everyday terms**
- Common technology terms
- Basic operations and concepts
- Widely understood terminology
- Entry-level concepts

#### `complexity.intermediate`
**Standard usage and moderate complexity**
- Professional terminology
- Industry-standard concepts
- Moderate technical depth
- Specialized but common terms

#### `complexity.advanced`
**Expert and specialized usage**
- Highly technical terminology
- Specialized professional concepts
- Advanced technical features
- Expert-level understanding required

### Usage Context

#### `context.formal`
**Official, professional, or academic contexts**
- Business communications
- Technical documentation
- Academic papers
- Official procedures

#### `context.informal`
**Casual, everyday, or social contexts**
- Social media
- Casual conversation
- Personal communication
- Entertainment content

#### `context.instructional`
**Teaching, learning, and guidance contexts**
- Tutorials and guides
- Educational materials
- Help documentation
- Training content

---

## Implementation Guidelines

### Tagging Principles

1. **Multiple Tags Encouraged**: Most terms should have 2-4 tags for optimal discoverability
2. **Hierarchical Consistency**: Use parent tags when child concepts apply
3. **Audience Sensitivity**: Consider cultural context for Polynesian language users
4. **Future Flexibility**: Tag structure supports easy expansion

### Example Tag Combinations

#### "Smartphone" (Hawaiian: "kelepona atamai")
- `technology.hardware`
- `technology.mobile`  
- `consumer.personal`
- `audience.consumer`
- `complexity.basic`

#### "Database" (Hawaiian: "waihona ʻikepili")
- `technology.data`
- `technology.software`
- `business.enterprise`
- `audience.technical`
- `complexity.intermediate`

#### "Machine Learning" (Hawaiian: "aʻo mīkini")
- `technology.ai`
- `technology.software`
- `development.programming`
- `audience.technical`
- `complexity.advanced`

#### "Save Button" (Hawaiian: "pihi mālama")
- `ui.buttons`
- `technology.software`
- `consumer.personal`
- `audience.consumer`
- `complexity.basic`

### Database Implementation

#### Proposed Schema Extension
```sql
-- Add tags table
CREATE TABLE translation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name VARCHAR(100) NOT NULL UNIQUE,
    tag_category VARCHAR(50) NOT NULL, -- 'domain', 'functional', 'context'
    tag_level INTEGER NOT NULL, -- 1, 2, or 3
    parent_tag_id UUID REFERENCES translation_tags(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add relationship table
CREATE TABLE translation_key_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES translation_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key_id, tag_id)
);
```

### Migration Strategy

1. **Phase 1**: Create tag structure and database schema
2. **Phase 2**: Tag existing UI/interface terms with current functional tags
3. **Phase 3**: Add technology domain tags for existing terms
4. **Phase 4**: Implement CSV import with automatic tag suggestions
5. **Phase 5**: Enhance web interface for tag management

---

## Maintenance and Evolution

### Regular Review Process
- **Quarterly**: Review new technology trends and terminology
- **Annually**: Assess tag structure effectiveness and usage patterns
- **As Needed**: Add new tags based on translation requirements

### Expansion Guidelines
- New Level 1 domains require significant new terminology scope
- Level 2 functional tags should align with user workflow patterns  
- Level 3 context tags should reflect actual usage scenarios

### Quality Assurance
- Maintain consistent tag naming conventions
- Ensure cultural appropriateness for Polynesian language contexts
- Regular validation of tag assignments for accuracy

---

**Version**: 1.0  
**Created**: November 15, 2025  
**Last Updated**: November 15, 2025  
**Status**: Ready for Implementation