import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import CustomLabel from './CustomLabel';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { S } from '../utils/responsive';

type ModalSelectInputProps = {
    label: string;
    placeholder: string;
    options: string[];
    onSelect: (value: string) => void;
    required?: boolean;
};

const ModalSelectInput: React.FC<ModalSelectInputProps> = ({
    label,
    placeholder,
    options,
    onSelect,
    required,
}) => {
    const [visible, setVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>('');

    const handleSelect = (item: string) => {
        setSelectedValue(item);
        onSelect(item);
        setVisible(false);
    };

    return (
        <>
            <CustomLabel label={label} required={required} />

            <TouchableOpacity style={styles.inputContainer} onPress={() => setVisible(true)}>
                <Text style={selectedValue ? styles.valueText : styles.placeholderText}>
                    {selectedValue || placeholder}
                </Text>
                <ChevronDown width={20} height={20} color={COLOR.PRIMARY} />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="slide"
                onRequestClose={() => setVisible(false)}
            >
                {/* Background Overlay */}
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>

                {/* Bottom Sheet Section */}
                <View style={styles.bottomSheet}>
                    <Text style={styles.sheetTitle}>{label}</Text>

                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.optionItem} onPress={() => handleSelect(item)}>
                                <Text style={styles.optionText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </>
    );
};

export default ModalSelectInput;

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: S(15),
        height: S(50),
        borderRadius: S(10),
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: S(20),
    },
    placeholderText: {
        fontFamily: FONTS.PRIMARY,
        fontSize: 15,
        color: '#999',
    },
    valueText: {
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 15,
        color: '#000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: S(20),
        borderTopRightRadius: S(20),
        padding: S(20),
        maxHeight: '50%',
    },
    sheetTitle: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        marginBottom: S(10),
    },
    optionItem: {
        paddingVertical: S(12),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
        fontFamily: FONTS.PRIMARY,
    },
});
