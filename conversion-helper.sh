#!/bin/bash

# shadcn/ui Component Conversion Helper Script
# This script provides helper functions for converting components to shadcn/ui

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}shadcn/ui Conversion Helper${NC}"
echo "================================"

# Function to find all components using old Modal
find_modal_usage() {
    echo -e "\n${YELLOW}Finding components using old Modal:${NC}"
    grep -r "from.*@/components/ui/Modal\|from.*\./ui/Modal" src/components/ | grep -v "node_modules" | cut -d: -f1 | sort | uniq
}

# Function to find all components using old Button with primary variant
find_primary_button() {
    echo -e "\n${YELLOW}Finding components using old Button 'primary' variant:${NC}"
    grep -r 'variant="primary"' src/ | grep -v "node_modules"
}

# Function to find all components using old Form components
find_form_components() {
    echo -e "\n${YELLOW}Finding components using old Form components:${NC}"
    grep -r "FormInput\|FormField\|FormLabel\|FormSelect\|FormTextarea\|FormError" src/components/ | grep -v "node_modules" | cut -d: -f1 | sort | uniq
}

# Function to list all modal files
list_modals() {
    echo -e "\n${YELLOW}All Modal Component Files:${NC}"
    find src/components -name "*Modal.tsx" -type f
}

# Function to check for custom CSS classes that should be replaced
find_custom_classes() {
    echo -e "\n${YELLOW}Finding custom button classes:${NC}"
    grep -r "btn-primary\|btn-secondary\|btn-ghost" src/ | grep -v "node_modules\|globals.css" | head -20
}

# Function to validate shadcn components are installed
check_shadcn_components() {
    echo -e "\n${YELLOW}Checking shadcn/ui components:${NC}"
    
    components=(
        "button"
        "dialog"
        "form"
        "input"
        "label"
        "select"
        "textarea"
        "card"
        "dropdown-menu"
        "badge"
        "separator"
        "tabs"
        "table"
        "alert"
        "sonner"
        "scroll-area"
        "command"
        "popover"
    )
    
    for comp in "${components[@]}"; do
        if [ -f "src/components/ui/${comp}.tsx" ]; then
            echo -e "${GREEN}✓${NC} ${comp}.tsx"
        else
            echo -e "${RED}✗${NC} ${comp}.tsx - MISSING"
        fi
    done
}

# Function to show conversion progress
show_progress() {
    echo -e "\n${YELLOW}Conversion Progress:${NC}"
    total_modals=$(find src/components -name "*Modal.tsx" -type f | wc -l | tr -d ' ')
    
    # Count converted (looking for Dialog imports)
    converted=$(grep -l "from.*@/components/ui/dialog\|from.*\./ui/dialog" src/components/*Modal.tsx 2>/dev/null | wc -l | tr -d ' ')
    
    remaining=$((total_modals - converted))
    percentage=$((converted * 100 / total_modals))
    
    echo "Total Modals: $total_modals"
    echo "Converted: $converted ($percentage%)"
    echo "Remaining: $remaining"
    
    # Show progress bar
    echo -n "Progress: ["
    for ((i=0; i<$percentage/5; i++)); do echo -n "="; done
    for ((i=$percentage/5; i<20; i++)); do echo -n " "; done
    echo "] $percentage%"
}

# Function to install additional shadcn components
install_component() {
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: install_component <component-name>${NC}"
        echo "Example: install_component calendar"
        return 1
    fi
    
    echo -e "${YELLOW}Installing shadcn component: $1${NC}"
    npx shadcn@latest add "$1" -y
}

# Function to check for import case sensitivity issues
check_import_cases() {
    echo -e "\n${YELLOW}Checking for import case sensitivity issues:${NC}"
    
    # Check for uppercase imports that should be lowercase
    grep -r "from.*@/components/ui/Button\|from.*@/components/ui/Modal\|from.*@/components/ui/Form" src/ | grep -v "node_modules"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Find components using old Modal"
    echo "2) Find components using old Form components"
    echo "3) Find primary button variants"
    echo "4) List all modal files"
    echo "5) Check shadcn components installation"
    echo "6) Show conversion progress"
    echo "7) Check for import case issues"
    echo "8) Install additional shadcn component"
    echo "9) Run all checks"
    echo "0) Exit"
    echo ""
    read -p "Enter choice: " choice
    
    case $choice in
        1) find_modal_usage ;;
        2) find_form_components ;;
        3) find_primary_button ;;
        4) list_modals ;;
        5) check_shadcn_components ;;
        6) show_progress ;;
        7) check_import_cases ;;
        8)
            read -p "Enter component name: " comp_name
            install_component "$comp_name"
            ;;
        9)
            check_shadcn_components
            show_progress
            find_modal_usage
            check_import_cases
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
    
    show_menu
}

# Check if script is being sourced or executed
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    # Script is being executed
    if [ "$1" == "--check" ]; then
        check_shadcn_components
        show_progress
    elif [ "$1" == "--find-modals" ]; then
        find_modal_usage
    elif [ "$1" == "--help" ]; then
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --check          Check installation and show progress"
        echo "  --find-modals    Find all components using old Modal"
        echo "  --help           Show this help message"
        echo "  (no option)      Show interactive menu"
    else
        show_menu
    fi
fi

# Export functions if sourced
export -f find_modal_usage
export -f find_form_components
export -f find_primary_button
export -f list_modals
export -f check_shadcn_components
export -f show_progress
export -f install_component
