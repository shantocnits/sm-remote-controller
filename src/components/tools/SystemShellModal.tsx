import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';

interface SystemShellModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ConsoleLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export const SystemShellModal: React.FC<SystemShellModalProps> = ({
  visible,
  onClose,
}) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<ConsoleLine[]>([
    { id: '1', type: 'system', text: 'SM Remote Terminal Bridge v1.0.0 [Ready]' },
    { id: '2', type: 'system', text: 'Connected to Galaxy S23 Ultra (Android 15 / Linux 6.1)' },
    { id: '3', type: 'system', text: 'Type "help" to see available remote commands.' },
  ]);

  const executeCommand = () => {
    const cmd = command.trim();
    if (!cmd) return;

    const newLines: ConsoleLine[] = [
      ...history,
      { id: `in-${Date.now()}`, type: 'input', text: `$ ${cmd}` },
    ];

    const lower = cmd.toLowerCase();
    if (lower === 'help') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: 'Available Commands:\n  status    - Show remote device health & battery\n  info      - Device hardware specifications\n  ls        - List storage files\n  ping      - Test network latency to partner\n  top       - Show memory and CPU usage\n  clear     - Clear terminal buffer\n  reboot    - Request remote system reboot',
      });
    } else if (lower === 'status') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: 'Device: Galaxy S23 Ultra\nBattery: 84% [Charging]\nThermal: 31.5°C Normal\nNetwork: Wi-Fi 6 (5.8 GHz) - Signal 98%\nSession: Encrypted WebRTC Live',
      });
    } else if (lower === 'info') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: 'CPU: Snapdragon 8 Gen 2 (8 Cores @ 3.36 GHz)\nRAM: 12 GB LPDDR5X (Used: 4.8 GB)\nStorage: 256 GB UFS 4.0 (Free: 142 GB)\nOS: Android 15 (Kernel 6.1.43-android15)',
      });
    } else if (lower === 'ls') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: 'drwxr-xr-x  DCIM/\ndrwxr-xr-x  Documents/\ndrwxr-xr-x  Download/\ndrwxr-xr-x  Pictures/\n-rw-r--r--  sm-remote-controller.apk',
      });
    } else if (lower === 'ping') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: 'PING partner device (948 201):\n64 bytes: icmp_seq=1 ttl=64 time=14.2 ms\n64 bytes: icmp_seq=2 ttl=64 time=12.8 ms\n--- ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss, avg = 13.5ms',
      });
    } else if (lower === 'top') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: 'Tasks: 382 total, 1 running, 381 sleeping\nCPU:  3.2% user,  1.8% sys, 95.0% idle\nMem:  12288M total, 4920M used, 7368M free',
      });
    } else if (lower === 'clear') {
      setHistory([]);
      setCommand('');
      return;
    } else {
      newLines.push({
        id: `err-${Date.now()}`,
        type: 'error',
        text: `bash: ${cmd}: command not found. Type "help" for a list of commands.`,
      });
    }

    setHistory(newLines);
    setCommand('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.titleIconBox}>
                <VectorIcon name="terminal" size={20} color="#22d3ee" />
              </View>
              <div>
                <Text style={[Typography.titleMedium, styles.title]}>System Shell</Text>
                <Text style={styles.subtitle}>Remote Bash & ADB Console</Text>
              </div>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Terminal Console View */}
          <ScrollView style={styles.consoleView} contentContainerStyle={styles.consoleContent}>
            {history.map((line) => (
              <Text
                key={line.id}
                style={[
                  styles.consoleText,
                  line.type === 'system' && styles.systemText,
                  line.type === 'input' && styles.inputText,
                  line.type === 'error' && styles.errorText,
                ]}>
                {line.text}
              </Text>
            ))}
          </ScrollView>

          {/* Command Input Bar */}
          <View style={styles.inputRow}>
            <Text style={styles.promptSymbol}>$</Text>
            <TextInput
              value={command}
              onChangeText={setCommand}
              onSubmitEditing={executeCommand}
              placeholder="Enter command (e.g. status, ping, ls)..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.commandInput}
            />
            <TouchableOpacity onPress={executeCommand} style={styles.execBtn}>
              <VectorIcon name="arrow-right" size={14} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0c0f14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#090a0c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#22d3ee',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consoleView: {
    height: 320,
    backgroundColor: '#05070a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
  },
  consoleContent: {
    paddingBottom: 20,
  },
  consoleText: {
    color: '#2dd4bf',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  systemText: {
    color: Colors.textGray,
  },
  inputText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.dangerRed,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161a22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  promptSymbol: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  commandInput: {
    flex: 1,
    color: Colors.textWhite,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  execBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
