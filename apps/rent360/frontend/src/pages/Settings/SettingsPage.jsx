import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiTag, FiShield, FiUsers, FiHardDrive, FiSettings, 
  FiLayers, FiArrowRight, FiSliders, FiCreditCard, FiGlobe
} from 'react-icons/fi';

import '../Stores/StoresList.scss';
import './SettingsPage.scss';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;

  const settingsCards = [
    {
      id: 'categories',
      title: 'Category Pipeline',
      description: 'Configure rental garment categories, SKU taxonomy codes, and apparel lines (Sherwani, Jodhpuri, Indo-Western, etc.)',
      icon: <FiTag />,
      badge: 'Catalog Pipeline',
      actionText: 'Configure Categories',
      route: '/categories',
      accentColor: '#0B60B0'
    },
    {
      id: 'collection',
      title: 'Collection & Inventory',
      description: 'Manage garment designs, rental prices, security deposits, and physical stock size variants.',
      icon: <FiLayers />,
      badge: 'Inventory Master',
      actionText: 'Open Collection',
      route: '/collection',
      accentColor: '#8B5CF6'
    },
    ...(!isSuperAdmin ? [
      {
        id: 'roles',
        title: 'Roles & Permissions',
        description: 'Define staff roles, granular access privileges, and security boundaries.',
        icon: <FiShield />,
        badge: 'Security',
        actionText: 'Manage Roles',
        route: '/roles',
        accentColor: '#10B981'
      },
      {
        id: 'staff',
        title: 'Team Members',
        description: 'Invite and manage store managers, sales executives, and warehouse operators.',
        icon: <FiUsers />,
        badge: 'Organization',
        actionText: 'Manage Staff',
        route: '/staff',
        accentColor: '#F59E0B'
      }
    ] : [
      {
        id: 'plans',
        title: 'Subscription Plans',
        description: 'Configure SaaS pricing plans, store design limits, user quotas, and billing tiers.',
        icon: <FiCreditCard />,
        badge: 'SaaS Billing',
        actionText: 'Configure Plans',
        route: '/plans',
        accentColor: '#F59E0B'
      },
      {
        id: 'bucket',
        title: 'Cloudinary Bucket Storage',
        description: 'Inspect cloud media buckets, image assets, and upload configurations.',
        icon: <FiHardDrive />,
        badge: 'Storage',
        actionText: 'Explore Buckets',
        route: '/bucket',
        accentColor: '#EC4899'
      }
    ])
  ];

  return (
    <div className="stores-view settings-page-view">
      {/* Top Header */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Settings & Configuration</h1>
          <p className="subtitle">
            Configure system masters, garment taxonomies, security roles, and business pipelines
          </p>
        </div>
      </div>

      {/* Grid of Settings Hub Cards */}
      <div className="settings-grid">
        {settingsCards.map((card) => (
          <div 
            key={card.id} 
            className="settings-card"
            onClick={() => navigate(card.route)}
          >
            <div className="card-top">
              <div 
                className="card-icon-wrap"
                style={{ color: card.accentColor, backgroundColor: `${card.accentColor}18` }}
              >
                {card.icon}
              </div>
              <span className="card-badge">{card.badge}</span>
            </div>

            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <p className="card-desc">{card.description}</p>
            </div>

            <div className="card-footer">
              <span className="action-text">{card.actionText}</span>
              <FiArrowRight className="arrow-icon" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
