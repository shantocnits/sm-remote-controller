import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { ToolItemData } from './ToolGridItem';
import { NeonCard } from '../common/NeonCard';

interface ToolsSearchModalProps {
  visible: boolean;
  onClose: () => void;
  tools: ToolItemData[];
  onSelectTool: (tool: ToolItemData) => void;
}

export const ToolsSearchModal: React.FC<ToolsSearchModalProps> = ({
  visible,
  onClose,
  tools,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'storage', label: 'Storage' },
    { id: 'comms', label: 'Communication' },
    { id: 'system', label: 'System' },
  ];

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesQuery =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesQuery) return false;

      if (activeCategory === 'storage') {
        return tool.id === 'file-manager' || tool.id === 'clipboard';
      }
      if (activeCategory === 'comms') {
        return tool.id === 'call-logs' || tool.id === 'live-chat';
      }
      if (activeCategory === 'system') {
        return tool.id === 'app-manager' || tool.id === 'system-shell';
      }
      return true;
    });
  }, [tools, searchQuery, activeCategory]);

  const handleSelect = (tool: ToolItemData) => {
    onClose();
    setTimeout(() => {
      onSelectTool(tool);
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header & Search Bar */}
          <View style={styles.headerRow}>
            <View style={styles.searchBar}>
              <VectorIcon name="search" size={16} color={Colors.brandGreen} />
              <TextInput
                placeholder="Search tools, files, commands..."
                placeholderTextColor={Colors.textGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                style={styles.input}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}>
                  <VectorIcon name="close" size={12} color={Colors.textGray} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.7}
                  onPress={() => setActiveCategory(cat.id)}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Filtered Tools List */}
          <ScrollView
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(tool)}
                  style={styles.toolItem}>
                  <View
                    style={[
                      styles.toolIconCircle,
                      { borderColor: tool.iconColor + '40' },
                    ]}>
                    <VectorIcon
                      name={tool.icon}
                      size={18}
                      color={tool.iconColor}
                    />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
                  </View>
                  <VectorIcon
                    name="arrow-right"
                    size={14}
                    color={Colors.brandGreen}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <VectorIcon name="search" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No matching tools found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    padding: 20,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.appBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    color: Colors.textWhite,
    fontSize: 14,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.appBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  categoryChipActive: {
    backgroundColor: Colors.brandGreen,
    borderColor: Colors.brandGreen,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textGray,
  },
  categoryTextActive: {
    color: '#000000',
  },
  resultsList: {
    maxHeight: 320,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.appBg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toolIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  toolSubtitle: {
    color: Colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: Colors.textGray,
    fontSize: 12,
    marginTop: 4,
  },
});
